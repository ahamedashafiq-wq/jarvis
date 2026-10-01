package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.auth.AuthManager
import com.example.data.auth.AuthState
import com.example.data.gemini.GeminiService
import com.example.data.gemini.ParsedIntent
import com.example.data.local.JarvisDatabase
import com.example.data.model.CommandEntity
import com.example.data.model.ConversationEntity
import com.example.data.model.FocusSessionEntity
import com.example.data.model.MemoryEntity
import com.example.data.model.MessageEntity
import com.example.data.model.NotificationEntity
import com.example.data.model.ProfileEntity
import com.example.data.model.SettingsEntity
import com.example.data.model.SystemEventEntity
import com.example.data.model.TaskEntity
import com.example.data.supabase.SupabaseService
import com.example.ui.components.AIOrbState
import com.example.ui.components.JarvisScreen
import com.example.ui.voice.VoiceManager
import com.example.ui.voice.VoiceState
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

enum class SubScreen {
    NONE,
    MEMORY,
    FOCUS,
    ANALYTICS,
    SETTINGS,
    LOGS,
    PROFILE
}

enum class AuthScreenState {
    LOGIN,
    SIGNUP,
    FORGOT_PASSWORD
}

@OptIn(ExperimentalCoroutinesApi::class)
class JarvisViewModel(application: Application) : AndroidViewModel(application) {

    private val db = JarvisDatabase.getInstance(application)
    val dao = db.jarvisDao()
    val supabaseService = SupabaseService(application)
    val authManager = AuthManager(application, dao, supabaseService)
    val geminiService = GeminiService()
    val voiceManager = VoiceManager(application)

    // Auth screen routing
    val authScreenState = MutableStateFlow(AuthScreenState.LOGIN)

    // Navigation state
    val currentScreen = MutableStateFlow(JarvisScreen.DASHBOARD)
    val currentSubScreen = MutableStateFlow(SubScreen.NONE)
    val isBootComplete = MutableStateFlow(false)

    // AI Core state
    val aiOrbState = MutableStateFlow(AIOrbState.IDLE)

    // Current Conversation
    val currentConversationId = MutableStateFlow<String?>(null)

    // Current User Session
    val currentSession = authManager.currentSession

    // Reactive Isolated Data Flows for Authenticated User
    val currentProfile: StateFlow<ProfileEntity?> = currentSession.flatMapLatest { session ->
        if (session != null) dao.getProfile(session.userId) else flowOf(null)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val currentSettings: StateFlow<SettingsEntity?> = currentSession.flatMapLatest { session ->
        if (session != null) dao.getSettings(session.userId) else flowOf(null)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val conversations = currentSession.flatMapLatest { session ->
        if (session != null) dao.getConversationsForUser(session.userId) else flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allMemories = currentSession.flatMapLatest { session ->
        if (session != null) dao.getMemoriesForUser(session.userId) else flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTasks = currentSession.flatMapLatest { session ->
        if (session != null) dao.getTasksForUser(session.userId) else flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val commandLogs = currentSession.flatMapLatest { session ->
        if (session != null) dao.getCommandsForUser(session.userId) else flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val focusSessions = currentSession.flatMapLatest { session ->
        if (session != null) dao.getFocusSessionsForUser(session.userId) else flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val systemEvents = currentSession.flatMapLatest { session ->
        if (session != null) dao.getSystemEventsForUser(session.userId) else flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val notifications = currentSession.flatMapLatest { session ->
        if (session != null) dao.getNotificationsForUser(session.userId) else flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Active conversation messages
    private val _currentMessages = MutableStateFlow<List<MessageEntity>>(emptyList())
    val currentMessages: StateFlow<List<MessageEntity>> = _currentMessages.asStateFlow()

    // Focus Session State
    val isFocusRunning = MutableStateFlow(false)
    val isFocusPaused = MutableStateFlow(false)
    val focusTargetMinutes = MutableStateFlow(25)
    val focusSecondsRemaining = MutableStateFlow(25 * 60)
    private var focusTimerJob: Job? = null

    // Streaming State
    val isStreamingActive = MutableStateFlow(false)
    private var streamingJob: Job? = null

    init {
        // Restore session on startup
        viewModelScope.launch {
            authManager.restoreSession()
        }

        // Observe conversation list to auto-select active conversation
        viewModelScope.launch {
            conversations.collect { list ->
                if (currentConversationId.value == null && list.isNotEmpty()) {
                    currentConversationId.value = list.first().id
                }
            }
        }

        // Fetch messages for active conversation
        viewModelScope.launch {
            currentConversationId.collect { id ->
                val uid = currentSession.value?.userId
                if (id != null && uid != null) {
                    dao.getMessagesForConversation(id, uid).collect { msgs ->
                        _currentMessages.value = msgs
                    }
                } else {
                    _currentMessages.value = emptyList()
                }
            }
        }

        // Synchronize Voice Manager state with AIOrb
        viewModelScope.launch {
            voiceManager.voiceState.collect { vState ->
                when (vState) {
                    VoiceState.LISTENING -> aiOrbState.value = AIOrbState.LISTENING
                    VoiceState.SPEAKING -> aiOrbState.value = AIOrbState.SPEAKING
                    VoiceState.PROCESSING -> aiOrbState.value = AIOrbState.THINKING
                    VoiceState.ERROR -> aiOrbState.value = AIOrbState.ERROR
                    VoiceState.IDLE -> {
                        if (!isStreamingActive.value && aiOrbState.value != AIOrbState.EXECUTING) {
                            aiOrbState.value = AIOrbState.IDLE
                        }
                    }
                }
            }
        }
    }

    // --- Boot Sequence ---
    fun completeBoot() {
        isBootComplete.value = true
        trackEvent("BOOT_COMPLETED", "{}")
    }

    // --- Chat & Gemini Operations ---
    fun selectConversation(id: String) {
        currentConversationId.value = id
    }

    fun startNewConversation(title: String = "Tactical Directive") {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            val conv = ConversationEntity(
                user_id = uid,
                title = "$title #${conversations.value.size + 1}"
            )
            dao.insertConversation(conv)
            currentConversationId.value = conv.id
            trackEvent("CONVERSATION_CREATED", "{\"id\":\"${conv.id}\"}")
        }
    }

    fun deleteConversation(id: String) {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            dao.deleteMessagesForConversation(id, uid)
            dao.deleteConversation(id, uid)
            if (currentConversationId.value == id) {
                currentConversationId.value = conversations.value.firstOrNull { it.id != id }?.id
            }
            trackEvent("CONVERSATION_DELETED", "{\"id\":\"$id\"}")
        }
    }

    fun sendMessage(text: String) {
        val uid = currentSession.value?.userId ?: return
        val trimmed = text.trim()
        if (trimmed.isBlank()) return

        viewModelScope.launch {
            var convId = currentConversationId.value
            if (convId == null) {
                val newConv = ConversationEntity(
                    user_id = uid,
                    title = trimmed.take(24)
                )
                dao.insertConversation(newConv)
                convId = newConv.id
                currentConversationId.value = convId
            }

            // Insert User Message
            val userMsg = MessageEntity(
                conversation_id = convId,
                user_id = uid,
                role = "user",
                content = trimmed
            )
            dao.insertMessage(userMsg)
            trackEvent("MESSAGE_SENT", "{\"length\":${trimmed.length}}")

            // Classify Intent
            aiOrbState.value = AIOrbState.THINKING
            isStreamingActive.value = true
            val intent = geminiService.classifyIntent(trimmed)

            var actionFeedback: String? = null
            when (intent) {
                is ParsedIntent.TaskCreate -> {
                    val task = TaskEntity(
                        user_id = uid,
                        title = intent.title,
                        description = intent.description,
                        priority = intent.priority,
                        due_date = intent.dueDate
                    )
                    dao.insertTask(task)
                    actionFeedback = "ACTION COMPLETED: Logged task \"${task.title}\" with ${task.priority} priority."
                    trackEvent("TASK_CREATED", "{\"title\":\"${task.title}\"}")
                    createNotification("TASK CREATED", "Directive \"${task.title}\" registered in Blade 02.")
                }
                is ParsedIntent.MemoryCreate -> {
                    val memory = MemoryEntity(
                        user_id = uid,
                        content = intent.content,
                        category = intent.category,
                        importance = intent.importance,
                        pinned = intent.importance == "CRITICAL"
                    )
                    dao.insertMemory(memory)
                    actionFeedback = "ACTION COMPLETED: Stored in Blade 03 (Memory) under [${memory.category}]."
                    trackEvent("MEMORY_CREATED", "{\"category\":\"${memory.category}\"}")
                    createNotification("MEMORY SAVED", "Node secured in persistent memory envelope.")
                }
                is ParsedIntent.FocusStart -> {
                    startFocus(intent.minutes)
                    actionFeedback = "ACTION COMPLETED: Focus protocol initialized for ${intent.minutes} minutes."
                    trackEvent("FOCUS_STARTED", "{\"minutes\":${intent.minutes}}")
                }
                is ParsedIntent.FocusStop -> {
                    stopFocus()
                    actionFeedback = "ACTION COMPLETED: Focus protocol terminated."
                }
                else -> {}
            }

            // Create Assistant Message Placeholder
            val assistantMsgId = UUID.randomUUID().toString()
            val initialContent = StringBuilder()
            val assistantMsg = MessageEntity(
                id = assistantMsgId,
                conversation_id = convId,
                user_id = uid,
                role = "assistant",
                content = "JARVIS IS THINKING...",
                isStreaming = true,
                intentTag = actionFeedback
            )
            dao.insertMessage(assistantMsg)

            val recentList = dao.getMessagesList(convId, uid).takeLast(6)
            val memories = dao.getMemoriesListForUser(uid)
            val activeTasks = dao.getActiveTasksList(uid)

            // Stream response
            streamingJob = launch {
                var firstChunk = true
                val finalAnswer = geminiService.streamResponse(
                    prompt = trimmed,
                    recentMessages = recentList,
                    relevantMemories = memories,
                    activeTasks = activeTasks
                ) { chunk ->
                    if (firstChunk) {
                        initialContent.clear()
                        firstChunk = false
                    }
                    initialContent.append(chunk)
                    val updated = assistantMsg.copy(
                        content = initialContent.toString(),
                        isStreaming = true
                    )
                    dao.updateMessage(updated)
                }

                val fullResponse = if (actionFeedback != null) {
                    "$finalAnswer\n\n✓ $actionFeedback"
                } else {
                    finalAnswer
                }

                dao.updateMessage(
                    assistantMsg.copy(
                        content = fullResponse,
                        isStreaming = false
                    )
                )

                trackEvent("MESSAGE_RECEIVED", "{\"length\":${fullResponse.length}}")
                isStreamingActive.value = false
                aiOrbState.value = AIOrbState.IDLE

                // Auto-speak if enabled in settings
                val settings = currentSettings.value
                if (settings?.auto_speak == true) {
                    voiceManager.speak(finalAnswer.take(240))
                }
            }
        }
    }

    fun stopStreaming() {
        streamingJob?.cancel()
        streamingJob = null
        isStreamingActive.value = false
        aiOrbState.value = AIOrbState.IDLE
    }

    // --- Task Operations ---
    fun createTask(title: String, description: String, priority: String, dueDate: String) {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            val task = TaskEntity(
                user_id = uid,
                title = title,
                description = description,
                priority = priority,
                due_date = dueDate
            )
            dao.insertTask(task)
            trackEvent("TASK_CREATED", "{\"title\":\"$title\"}")
            createNotification("TASK CREATED", "Directive \"$title\" added to action queue.")
        }
    }

    fun toggleTaskComplete(task: TaskEntity) {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            val isCompleted = task.status == "COMPLETED"
            val newStatus = if (isCompleted) "TODO" else "COMPLETED"
            val completedTime = if (isCompleted) null else System.currentTimeMillis()
            dao.updateTaskStatus(task.id, uid, newStatus, completedTime)
            val eventName = if (isCompleted) "TASK_RESTORED" else "TASK_COMPLETED"
            trackEvent(eventName, "{\"id\":\"${task.id}\"}")
            if (!isCompleted) {
                createNotification("TASK COMPLETE", "Mission completed: ${task.title}")
            }
        }
    }

    fun deleteTask(id: String) {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            dao.deleteTaskById(id, uid)
            trackEvent("TASK_DELETED", "{\"id\":\"$id\"}")
        }
    }

    // --- Memory Operations ---
    fun createMemory(content: String, category: String, importance: String, isPinned: Boolean) {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            val mem = MemoryEntity(
                user_id = uid,
                content = content,
                category = category,
                importance = importance,
                pinned = isPinned
            )
            dao.insertMemory(mem)
            trackEvent("MEMORY_CREATED", "{\"category\":\"$category\"}")
            createNotification("MEMORY SAVED", "Node committed to persistent bank under [$category].")
        }
    }

    fun toggleMemoryPin(memory: MemoryEntity) {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            dao.updateMemory(memory.copy(pinned = !memory.pinned, updated_at = System.currentTimeMillis()))
            trackEvent("MEMORY_UPDATED", "{\"pinned\":${!memory.pinned}}")
        }
    }

    fun deleteMemory(id: String) {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            dao.deleteMemoryById(id, uid)
            trackEvent("MEMORY_DELETED", "{\"id\":\"$id\"}")
        }
    }

    fun clearAllMemories() {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            dao.clearMemoriesForUser(uid)
            trackEvent("MEMORY_PURGED", "{}")
        }
    }

    // --- Settings Operations ---
    fun updateSettings(updated: SettingsEntity) {
        viewModelScope.launch {
            dao.updateSettings(updated.copy(updated_at = System.currentTimeMillis()))
            trackEvent("SETTINGS_UPDATED", "{}")
        }
    }

    fun updateProfile(updated: ProfileEntity) {
        viewModelScope.launch {
            dao.updateProfile(updated.copy(updated_at = System.currentTimeMillis()))
            trackEvent("PROFILE_UPDATED", "{\"display_name\":\"${updated.display_name}\"}")
        }
    }

    // --- Focus Protocol Operations ---
    fun startFocus(minutes: Int) {
        val uid = currentSession.value?.userId ?: return
        focusTargetMinutes.value = minutes
        focusSecondsRemaining.value = minutes * 60
        isFocusRunning.value = true
        isFocusPaused.value = false

        trackEvent("FOCUS_STARTED", "{\"minutes\":$minutes}")

        focusTimerJob?.cancel()
        focusTimerJob = viewModelScope.launch {
            while (focusSecondsRemaining.value > 0) {
                delay(1000)
                if (!isFocusPaused.value) {
                    focusSecondsRemaining.value -= 1
                }
            }
            isFocusRunning.value = false
            aiOrbState.value = AIOrbState.SUCCESS
            dao.insertFocusSession(
                FocusSessionEntity(
                    user_id = uid,
                    duration = focusTargetMinutes.value,
                    status = "COMPLETED",
                    completed_at = System.currentTimeMillis()
                )
            )
            trackEvent("FOCUS_COMPLETED", "{\"duration\":${focusTargetMinutes.value}}")
            createNotification("FOCUS COMPLETE", "Mission complete. Focus protocol accomplished.")
            voiceManager.speak("Mission complete. Focus protocol accomplished, Commander.")
            delay(3000)
            aiOrbState.value = AIOrbState.IDLE
        }
    }

    fun pauseFocus() {
        isFocusPaused.value = true
    }

    fun resumeFocus() {
        isFocusPaused.value = false
    }

    fun stopFocus() {
        val uid = currentSession.value?.userId
        focusTimerJob?.cancel()
        focusTimerJob = null
        if (isFocusRunning.value && uid != null) {
            val completedMins = (focusTargetMinutes.value * 60 - focusSecondsRemaining.value) / 60
            if (completedMins > 0) {
                viewModelScope.launch {
                    dao.insertFocusSession(
                        FocusSessionEntity(
                            user_id = uid,
                            duration = completedMins,
                            status = "ABORTED",
                            completed_at = System.currentTimeMillis()
                        )
                    )
                }
            }
        }
        isFocusRunning.value = false
        isFocusPaused.value = false
        focusSecondsRemaining.value = focusTargetMinutes.value * 60
    }

    // --- Command Terminal Pipeline ---
    fun executeCommand(commandStr: String) {
        val uid = currentSession.value?.userId ?: return
        val trimmed = commandStr.trim()
        if (trimmed.isBlank()) return

        viewModelScope.launch {
            val cmdId = UUID.randomUUID().toString()
            val initialLog = CommandEntity(
                id = cmdId,
                user_id = uid,
                command = trimmed,
                status = "VALIDATING",
                result = "Parsing tactical directive..."
            )
            dao.insertCommand(initialLog)
            aiOrbState.value = AIOrbState.EXECUTING
            delay(150)

            when {
                trimmed == "/help" || trimmed == "help" -> {
                    val out = """AVAILABLE TACTICAL DIRECTIVES:
• /status     - Comprehensive telemetry & blade status
• /tasks      - List active tactical objectives
• /memory     - Query memory recall index
• /focus [m]  - Start focus protocol (default: 25m)
• /analytics  - Display productivity statistics
• /profile    - Operator dossier & credentials
• /settings   - Open configuration panel
• /logout     - Terminate active session
• /clear      - Clear command log terminal"""
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = out))
                }

                trimmed == "/status" || trimmed == "status" -> {
                    val mems = dao.getMemoriesListForUser(uid).size
                    val tasks = dao.getActiveTasksList(uid).size
                    val live = geminiService.isLiveAiAvailable
                    val supa = authManager.isSupabaseConfigured
                    val out = """SYSTEM TELEMETRY REPORT:
• KERNEL: JARVIS ZORO EDITION v2.0
• OPERATOR: ${currentProfile.value?.display_name ?: "COMMANDER"} ($uid)
• BACKEND: ${if (supa) "SUPABASE POSTGRESQL [CONNECTED]" else "LOCAL SQLITE ROOM [SECURE SANDBOX]"}
• BLADE 01 (KNOWLEDGE): ${if (live) "GEMINI 3.5 FLASH [ONLINE]" else "LOCAL SYNAPSE [DEMO MODE]"}
• BLADE 02 (ACTION): $tasks ACTIVE DIRECTIVES
• BLADE 03 (MEMORY): $mems PERSISTENT NODES
• AUDIO PROTOCOL: ${if (voiceManager.voiceState.value != VoiceState.ERROR) "READY" else "UNAVAILABLE"}"""
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = out))
                }

                trimmed == "/clear" -> {
                    dao.clearCommandsForUser(uid)
                }

                trimmed == "/logout" -> {
                    authManager.logout()
                }

                trimmed.startsWith("/focus") -> {
                    val mins = Regex("(\\d+)").find(trimmed)?.groupValues?.get(1)?.toIntOrNull() ?: 25
                    startFocus(mins)
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = "Focus protocol initialized for $mins minutes."))
                }

                trimmed == "/tasks" -> {
                    val active = dao.getActiveTasksList(uid)
                    val out = if (active.isEmpty()) "No active tasks in action queue."
                    else active.joinToString("\n") { "• [${it.priority}] ${it.title} (${it.status})" }
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = out))
                }

                trimmed == "/memory" -> {
                    val mems = dao.getMemoriesListForUser(uid)
                    val out = if (mems.isEmpty()) "Memory bank is currently vacant."
                    else mems.take(6).joinToString("\n") { "• [${it.category}] ${it.content}" }
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = out))
                }

                trimmed == "/analytics" -> {
                    currentSubScreen.value = SubScreen.ANALYTICS
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = "Rerouting to Tactical Analytics screen."))
                }

                trimmed == "/profile" -> {
                    currentSubScreen.value = SubScreen.PROFILE
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = "Rerouting to Operator Profile & Dossier."))
                }

                trimmed == "/settings" -> {
                    currentSubScreen.value = SubScreen.SETTINGS
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = "Opening system configuration."))
                }

                else -> {
                    val intent = geminiService.classifyIntent(trimmed)
                    val out = "Directive executed: Classified as ${intent::class.simpleName}"
                    dao.insertCommand(initialLog.copy(status = "SUCCESS", result = out))
                }
            }

            trackEvent("COMMAND_EXECUTED", "{\"command\":\"${trimmed.take(20)}\"}")
            delay(150)
            aiOrbState.value = AIOrbState.IDLE
        }
    }

    // --- Helpers ---
    fun trackEvent(eventType: String, eventData: String = "{}") {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            authManager.trackEvent(uid, eventType, eventData)
        }
    }

    fun createNotification(title: String, message: String, type: String = "INFO") {
        val uid = currentSession.value?.userId ?: return
        viewModelScope.launch {
            authManager.createNotification(uid, title, message, type)
        }
    }

    fun logout() {
        viewModelScope.launch {
            authManager.logout()
            currentScreen.value = JarvisScreen.DASHBOARD
            currentSubScreen.value = SubScreen.NONE
        }
    }

    override fun onCleared() {
        super.onCleared()
        voiceManager.release()
        focusTimerJob?.cancel()
        streamingJob?.cancel()
    }
}
