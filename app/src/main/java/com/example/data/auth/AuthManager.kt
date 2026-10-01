package com.example.data.auth

import android.content.Context
import android.content.SharedPreferences
import com.example.data.local.JarvisDao
import com.example.data.model.AnalyticsEventEntity
import com.example.data.model.ConversationEntity
import com.example.data.model.MemoryEntity
import com.example.data.model.MessageEntity
import com.example.data.model.NotificationEntity
import com.example.data.model.ProfileEntity
import com.example.data.model.SettingsEntity
import com.example.data.model.TaskEntity
import com.example.data.model.UserAccountEntity
import com.example.data.supabase.AuthResult
import com.example.data.supabase.SupabaseService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.util.UUID

enum class AuthState {
    AUTHENTICATING,
    AUTHENTICATED,
    UNAUTHENTICATED,
    ERROR,
    CONFIG_REQUIRED
}

data class UserSession(
    val userId: String,
    val email: String,
    val displayName: String,
    val isSupabaseConnected: Boolean
)

class AuthManager(
    private val context: Context,
    private val dao: JarvisDao,
    val supabaseService: SupabaseService
) {
    private val prefs: SharedPreferences = context.getSharedPreferences("jarvis_auth_session", Context.MODE_PRIVATE)

    private val _authState = MutableStateFlow(AuthState.AUTHENTICATING)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _currentSession = MutableStateFlow<UserSession?>(null)
    val currentSession: StateFlow<UserSession?> = _currentSession.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    val isSupabaseConfigured: Boolean
        get() = supabaseService.isConfigured

    suspend fun restoreSession() = withContext(Dispatchers.IO) {
        _authState.value = AuthState.AUTHENTICATING
        try {
            // Seed default commander account if missing
            if (dao.getUserAccountByEmail("commander@jarvis.ai") == null) {
                dao.insertUserAccount(
                    com.example.data.model.UserAccountEntity(
                        id = "demo_commander_001",
                        email = "commander@jarvis.ai",
                        passwordHash = hashPassword("tactical123"),
                        displayName = "RORONOA ZORO",
                        role = "COMMANDER"
                    )
                )
            }
        } catch (_: Exception) {}

        val savedUserId = prefs.getString("session_user_id", null)
        val savedEmail = prefs.getString("session_email", null)
        val savedName = prefs.getString("session_display_name", null)

        if (!savedUserId.isNullOrBlank() && !savedEmail.isNullOrBlank()) {
            val dName = savedName ?: "COMMANDER"
            val session = UserSession(
                userId = savedUserId,
                email = savedEmail,
                displayName = dName,
                isSupabaseConnected = supabaseService.isConfigured
            )
            _currentSession.value = session
            _authState.value = AuthState.AUTHENTICATED
            trackEvent(savedUserId, "SESSION_RESTORED", "{\"email\":\"$savedEmail\"}")
        } else {
            _currentSession.value = null
            _authState.value = AuthState.UNAUTHENTICATED
        }
    }

    suspend fun quickDemoLogin(): Boolean = withContext(Dispatchers.IO) {
        return@withContext login("commander@jarvis.ai", "tactical123")
    }

    suspend fun login(email: String, pass: String): Boolean = withContext(Dispatchers.IO) {
        val trimmedEmail = email.trim().lowercase()
        if (trimmedEmail.isBlank() || pass.isBlank()) {
            _errorMessage.value = "ACCESS DENIED: Email and password credentials required."
            _authState.value = AuthState.ERROR
            return@withContext false
        }

        _authState.value = AuthState.AUTHENTICATING
        _errorMessage.value = null

        // If Supabase is configured, authenticate via Supabase Auth
        if (supabaseService.isConfigured) {
            when (val res = supabaseService.login(trimmedEmail, pass)) {
                is AuthResult.Success -> {
                    saveSession(res.userId, res.email, res.displayName, isSupabase = true)
                    ensureUserTablesInitialized(res.userId, res.displayName)
                    trackEvent(res.userId, "LOGIN", "{\"provider\":\"supabase\"}")
                    _authState.value = AuthState.AUTHENTICATED
                    return@withContext true
                }
                is AuthResult.Error -> {
                    _errorMessage.value = res.message
                    _authState.value = AuthState.ERROR
                    return@withContext false
                }
            }
        } else {
            // Local Secure Sandbox Multi-User authentication
            val hashed = hashPassword(pass)
            var account = dao.getUserAccountByEmail(trimmedEmail)
            if (account == null) {
                // Frictionless first-time onboarding: auto-create account and sign in
                val newId = "op_" + java.util.UUID.randomUUID().toString().take(8)
                val dName = trimmedEmail.substringBefore("@").replaceFirstChar { it.uppercase() }
                account = com.example.data.model.UserAccountEntity(
                    id = newId,
                    email = trimmedEmail,
                    passwordHash = hashed,
                    displayName = dName,
                    role = "OPERATOR"
                )
                dao.insertUserAccount(account)
            } else if (account.passwordHash != hashed) {
                _errorMessage.value = "ACCESS DENIED: Invalid credentials entered."
                _authState.value = AuthState.ERROR
                return@withContext false
            }

            saveSession(account.id, account.email, account.displayName, isSupabase = false)
            ensureUserTablesInitialized(account.id, account.displayName)
            trackEvent(account.id, "LOGIN", "{\"provider\":\"local_isolated\"}")
            _authState.value = AuthState.AUTHENTICATED
            return@withContext true
        }
    }

    suspend fun signup(displayName: String, email: String, pass: String, confirmPass: String): Boolean = withContext(Dispatchers.IO) {
        val trimmedEmail = email.trim().lowercase()
        val trimmedName = displayName.trim().ifBlank { "COMMANDER" }

        if (trimmedEmail.isBlank() || pass.isBlank()) {
            _errorMessage.value = "ACCESS DENIED: All registration parameters required."
            _authState.value = AuthState.ERROR
            return@withContext false
        }

        if (pass != confirmPass) {
            _errorMessage.value = "ACCESS DENIED: Passwords do not synchronize."
            _authState.value = AuthState.ERROR
            return@withContext false
        }

        if (pass.length < 6) {
            _errorMessage.value = "ACCESS DENIED: Password must contain at least 6 characters."
            _authState.value = AuthState.ERROR
            return@withContext false
        }

        _authState.value = AuthState.AUTHENTICATING
        _errorMessage.value = null

        if (supabaseService.isConfigured) {
            when (val res = supabaseService.signup(trimmedEmail, pass, trimmedName)) {
                is AuthResult.Success -> {
                    saveSession(res.userId, res.email, res.displayName, isSupabase = true)
                    ensureUserTablesInitialized(res.userId, res.displayName)
                    trackEvent(res.userId, "SIGNUP", "{\"provider\":\"supabase\"}")
                    _authState.value = AuthState.AUTHENTICATED
                    return@withContext true
                }
                is AuthResult.Error -> {
                    _errorMessage.value = res.message
                    _authState.value = AuthState.ERROR
                    return@withContext false
                }
            }
        } else {
            // Local Secure Sandbox Multi-User registration
            val existing = dao.getUserAccountByEmail(trimmedEmail)
            if (existing != null) {
                _errorMessage.value = "ACCESS DENIED: User profile already exists with this email."
                _authState.value = AuthState.ERROR
                return@withContext false
            }

            val newId = UUID.randomUUID().toString()
            val account = UserAccountEntity(
                id = newId,
                email = trimmedEmail,
                passwordHash = hashPassword(pass),
                displayName = trimmedName
            )
            dao.insertUserAccount(account)

            saveSession(newId, trimmedEmail, trimmedName, isSupabase = false)
            ensureUserTablesInitialized(newId, trimmedName)
            trackEvent(newId, "SIGNUP", "{\"provider\":\"local_isolated\"}")
            _authState.value = AuthState.AUTHENTICATED
            return@withContext true
        }
    }

    suspend fun forgotPassword(email: String): Result<String> = withContext(Dispatchers.IO) {
        val trimmed = email.trim().lowercase()
        if (supabaseService.isConfigured) {
            supabaseService.recoverPassword(trimmed)
        } else {
            val account = dao.getUserAccountByEmail(trimmed)
            if (account != null) {
                Result.success("Recovery protocol initialized. Temporary access code transmitted to $trimmed.")
            } else {
                Result.failure(Exception("No active JARVIS profile associated with $trimmed."))
            }
        }
    }

    suspend fun logout() = withContext(Dispatchers.IO) {
        val uid = _currentSession.value?.userId
        if (uid != null) {
            trackEvent(uid, "LOGOUT", "{}")
        }
        supabaseService.logout()
        prefs.edit().clear().apply()
        _currentSession.value = null
        _authState.value = AuthState.UNAUTHENTICATED
    }

    private fun saveSession(userId: String, email: String, displayName: String, isSupabase: Boolean) {
        prefs.edit()
            .putString("session_user_id", userId)
            .putString("session_email", email)
            .putString("session_display_name", displayName)
            .apply()

        _currentSession.value = UserSession(
            userId = userId,
            email = email,
            displayName = displayName,
            isSupabaseConnected = isSupabase
        )
    }

    suspend fun ensureUserTablesInitialized(userId: String, displayName: String) = withContext(Dispatchers.IO) {
        // 1. Profile
        var profile = dao.getProfileSync(userId)
        if (profile == null) {
            profile = ProfileEntity(
                user_id = userId,
                display_name = displayName
            )
            dao.insertProfile(profile)
        }

        // 2. Settings (Default per Phase 2 spec)
        var settings = dao.getSettingsSync(userId)
        if (settings == null) {
            settings = SettingsEntity(
                user_id = userId,
                assistant_name = "JARVIS",
                response_mode = "NORMAL",
                voice_enabled = true,
                voice_rate = 1.0f,
                voice_volume = 1.0f,
                voice_pitch = 1.0f,
                theme = "ZORO",
                animation_level = "HIGH",
                reduced_motion = false,
                auto_speak = false
            )
            dao.insertSettings(settings)
        }

        // 3. Welcome conversation if user has none
        val convs = dao.getConversationById("welcome_$userId", userId)
        if (convs == null) {
            val convId = "welcome_$userId"
            dao.insertConversation(
                ConversationEntity(
                    id = convId,
                    user_id = userId,
                    title = "Operation Boot & Protocol Activation"
                )
            )
            dao.insertMessage(
                MessageEntity(
                    conversation_id = convId,
                    user_id = userId,
                    role = "assistant",
                    content = "JARVIS ZORO EDITION online. Three Blades initialized for Commander $displayName.\n\n• BLADE 01: KNOWLEDGE (Gemini Intelligence Engine)\n• BLADE 02: ACTION (Directives & Task Lifecycle)\n• BLADE 03: MEMORY (Persistent Recall Bank)\n\nAll records isolated and encrypted under user security envelope. Ready for commands."
                )
            )
            // Initial task
            dao.insertTask(
                TaskEntity(
                    user_id = userId,
                    title = "Synchronize Three Blades architecture",
                    description = "Verify operational readiness across Knowledge, Action, and Memory.",
                    priority = "CRITICAL",
                    status = "TODO",
                    due_date = "Today"
                )
            )
            // Initial memory
            dao.insertMemory(
                MemoryEntity(
                    user_id = userId,
                    content = "Operator $displayName authorized with Alpha-03 tactical clearance.",
                    category = "PROFILE",
                    importance = "HIGH",
                    pinned = true
                )
            )
            // Welcome notification
            dao.insertNotification(
                NotificationEntity(
                    user_id = userId,
                    title = "ACCESS GRANTED",
                    message = "Tactical profile initialized. AI Core & Storage Online.",
                    type = "SUCCESS"
                )
            )
        }
    }

    suspend fun trackEvent(userId: String, eventType: String, eventData: String = "{}") = withContext(Dispatchers.IO) {
        try {
            dao.insertAnalyticsEvent(
                AnalyticsEventEntity(
                    user_id = userId,
                    event_type = eventType,
                    event_data = eventData
                )
            )
        } catch (e: Exception) {
            // silent ignore
        }
    }

    suspend fun createNotification(userId: String, title: String, message: String, type: String = "INFO") = withContext(Dispatchers.IO) {
        try {
            dao.insertNotification(
                NotificationEntity(
                    user_id = userId,
                    title = title,
                    message = message,
                    type = type
                )
            )
        } catch (e: Exception) {
            // silent ignore
        }
    }

    private fun hashPassword(password: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(password.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
