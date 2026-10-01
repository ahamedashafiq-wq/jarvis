package com.example.data.supabase

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.example.BuildConfig
import com.example.data.model.ProfileEntity
import com.example.data.model.SettingsEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

sealed class AuthResult {
    data class Success(val userId: String, val email: String, val displayName: String, val token: String) : AuthResult()
    data class Error(val message: String) : AuthResult()
}

class SupabaseService(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jarvis_supabase_prefs", Context.MODE_PRIVATE)

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val supabaseUrl: String
        get() {
            // Check BuildConfig or user-configured preference
            val fromConfig = try {
                val field = BuildConfig::class.java.getField("VITE_SUPABASE_URL")
                val v = field.get(null) as? String ?: ""
                if (v == "MY_SUPABASE_URL" || v == "null") "" else v
            } catch (e: Exception) {
                ""
            }
            val stored = prefs.getString("custom_supabase_url", "") ?: ""
            return when {
                stored.isNotBlank() -> stored
                fromConfig.isNotBlank() -> fromConfig
                else -> ""
            }
        }

    val supabaseAnonKey: String
        get() {
            val fromConfig = try {
                val field = BuildConfig::class.java.getField("VITE_SUPABASE_ANON_KEY")
                val v = field.get(null) as? String ?: ""
                if (v == "MY_SUPABASE_ANON_KEY" || v == "null") "" else v
            } catch (e: Exception) {
                ""
            }
            val stored = prefs.getString("custom_supabase_anon_key", "") ?: ""
            return when {
                stored.isNotBlank() -> stored
                fromConfig.isNotBlank() -> fromConfig
                else -> ""
            }
        }

    val isConfigured: Boolean
        get() = supabaseUrl.isNotBlank() && supabaseAnonKey.isNotBlank()

    var authToken: String?
        get() = prefs.getString("auth_token", null)
        set(value) = prefs.edit().putString("auth_token", value).apply()

    var currentUserId: String?
        get() = prefs.getString("current_user_id", null)
        set(value) = prefs.edit().putString("current_user_id", value).apply()

    var currentUserEmail: String?
        get() = prefs.getString("current_user_email", null)
        set(value) = prefs.edit().putString("current_user_email", value).apply()

    var currentUserDisplayName: String?
        get() = prefs.getString("current_user_display_name", null)
        set(value) = prefs.edit().putString("current_user_display_name", value).apply()

    fun setCustomCredentials(url: String, key: String) {
        prefs.edit()
            .putString("custom_supabase_url", url.trim().removeSuffix("/"))
            .putString("custom_supabase_anon_key", key.trim())
            .apply()
    }

    suspend fun signup(email: String, pass: String, displayName: String): AuthResult = withContext(Dispatchers.IO) {
        if (!isConfigured) {
            return@withContext AuthResult.Error("DATABASE CONFIGURATION REQUIRED: Supabase URL and Anon Key not set.")
        }
        try {
            val url = "$supabaseUrl/auth/v1/signup"
            val body = JSONObject().apply {
                put("email", email)
                put("password", pass)
                val dataObj = JSONObject()
                dataObj.put("display_name", displayName)
                put("data", dataObj)
            }
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", supabaseAnonKey)
                .addHeader("Content-Type", "application/json")
                .post(body.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                val respStr = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    val errJson = try { JSONObject(respStr) } catch (e: Exception) { null }
                    val msg = errJson?.optString("msg") ?: errJson?.optString("error_description") ?: "ACCESS DENIED: Signup rejected (${response.code})"
                    return@withContext AuthResult.Error(msg)
                }

                val json = JSONObject(respStr)
                val user = json.optJSONObject("user")
                val uid = user?.optString("id") ?: json.optString("id")
                val token = json.optString("access_token", "")

                currentUserId = uid
                currentUserEmail = email
                currentUserDisplayName = displayName
                authToken = token

                // Auto initialize profile and default settings in database
                initRemoteProfileAndSettings(uid, displayName, token)

                AuthResult.Success(userId = uid, email = email, displayName = displayName, token = token)
            }
        } catch (e: Exception) {
            Log.e("SupabaseService", "Signup network exception", e)
            AuthResult.Error("DATABASE CONNECTION FAILED: Unable to reach authentication server.")
        }
    }

    suspend fun login(email: String, pass: String): AuthResult = withContext(Dispatchers.IO) {
        if (!isConfigured) {
            return@withContext AuthResult.Error("DATABASE CONFIGURATION REQUIRED: Supabase URL and Anon Key not set.")
        }
        try {
            val url = "$supabaseUrl/auth/v1/token?grant_type=password"
            val body = JSONObject().apply {
                put("email", email)
                put("password", pass)
            }
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", supabaseAnonKey)
                .addHeader("Content-Type", "application/json")
                .post(body.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                val respStr = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    val errJson = try { JSONObject(respStr) } catch (e: Exception) { null }
                    val msg = errJson?.optString("error_description") ?: errJson?.optString("msg") ?: "ACCESS DENIED: Invalid credentials."
                    return@withContext AuthResult.Error(msg)
                }

                val json = JSONObject(respStr)
                val token = json.optString("access_token")
                val user = json.optJSONObject("user")
                val uid = user?.optString("id") ?: ""
                val userMeta = user?.optJSONObject("user_metadata")
                val dName = userMeta?.optString("display_name", "COMMANDER") ?: "COMMANDER"

                currentUserId = uid
                currentUserEmail = email
                currentUserDisplayName = dName
                authToken = token

                AuthResult.Success(userId = uid, email = email, displayName = dName, token = token)
            }
        } catch (e: Exception) {
            Log.e("SupabaseService", "Login network exception", e)
            AuthResult.Error("DATABASE CONNECTION FAILED: Unable to reach authentication server.")
        }
    }

    suspend fun recoverPassword(email: String): Result<String> = withContext(Dispatchers.IO) {
        if (!isConfigured) {
            return@withContext Result.failure(Exception("DATABASE CONFIGURATION REQUIRED"))
        }
        try {
            val url = "$supabaseUrl/auth/v1/recover"
            val body = JSONObject().apply { put("email", email) }
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", supabaseAnonKey)
                .addHeader("Content-Type", "application/json")
                .post(body.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Result.success("Recovery transmission dispatched to $email")
                } else {
                    Result.failure(Exception("RECOVERY TRANSMISSION FAILED (${response.code})"))
                }
            }
        } catch (e: Exception) {
            Result.failure(Exception("DATABASE CONNECTION FAILED"))
        }
    }

    fun logout() {
        authToken = null
        currentUserId = null
        currentUserEmail = null
        currentUserDisplayName = null
    }

    private suspend fun initRemoteProfileAndSettings(userId: String, displayName: String, token: String) = withContext(Dispatchers.IO) {
        try {
            val authHeader = if (token.isNotBlank()) "Bearer $token" else "Bearer $supabaseAnonKey"
            // Insert profile
            val profileUrl = "$supabaseUrl/rest/v1/profiles"
            val profileBody = JSONObject().apply {
                put("user_id", userId)
                put("display_name", displayName)
                put("created_at", System.currentTimeMillis())
                put("updated_at", System.currentTimeMillis())
            }
            val profileReq = Request.Builder()
                .url(profileUrl)
                .addHeader("apikey", supabaseAnonKey)
                .addHeader("Authorization", authHeader)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=minimal")
                .post(profileBody.toString().toRequestBody("application/json".toMediaType()))
                .build()
            client.newCall(profileReq).execute().close()

            // Insert default settings
            val settingsUrl = "$supabaseUrl/rest/v1/settings"
            val settingsBody = JSONObject().apply {
                put("user_id", userId)
                put("assistant_name", "JARVIS")
                put("response_mode", "NORMAL")
                put("voice_enabled", true)
                put("voice_rate", 1.0)
                put("voice_volume", 1.0)
                put("voice_pitch", 1.0)
                put("theme", "ZORO")
                put("animation_level", "HIGH")
                put("reduced_motion", false)
                put("auto_speak", false)
                put("created_at", System.currentTimeMillis())
                put("updated_at", System.currentTimeMillis())
            }
            val settingsReq = Request.Builder()
                .url(settingsUrl)
                .addHeader("apikey", supabaseAnonKey)
                .addHeader("Authorization", authHeader)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=minimal")
                .post(settingsBody.toString().toRequestBody("application/json".toMediaType()))
                .build()
            client.newCall(settingsReq).execute().close()
        } catch (e: Exception) {
            Log.e("SupabaseService", "Failed to init remote profile/settings", e)
        }
    }
}
