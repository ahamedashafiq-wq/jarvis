package com.example.data.gemini

import android.util.Log
import com.example.BuildConfig
import com.example.data.model.MemoryEntity
import com.example.data.model.MessageEntity
import com.example.data.model.TaskEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit

sealed class ParsedIntent {
    data class Chat(val response: String) : ParsedIntent()
    data class MemoryCreate(val content: String, val category: String, val importance: String) : ParsedIntent()
    data class MemoryRead(val query: String?) : ParsedIntent()
    data class MemoryDelete(val targetQuery: String) : ParsedIntent()
    data class TaskCreate(val title: String, val description: String, val priority: String, val dueDate: String) : ParsedIntent()
    data class TaskComplete(val taskTitle: String) : ParsedIntent()
    data class TaskList(val filter: String?) : ParsedIntent()
    data class FocusStart(val minutes: Int) : ParsedIntent()
    data class FocusStop(val reason: String = "") : ParsedIntent()
    data class SystemStatus(val query: String = "") : ParsedIntent()
    data class AnalyticsQuery(val timeframe: String = "TODAY") : ParsedIntent()
    data class Unknown(val rawText: String) : ParsedIntent()
}

enum class GeminiHealthStatus {
    ONLINE,
    CONFIGURATION_REQUIRED,
    DEGRADED
}

class GeminiService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(45, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .writeTimeout(45, TimeUnit.SECONDS)
        .build()

    private var activeCall: Call? = null

    private val apiKey: String
        get() = BuildConfig.GEMINI_API_KEY.let { key: String? ->
            if (key.isNullOrBlank() || key == "MY_GEMINI_API_KEY") "" else key
        }

    val isLiveAiAvailable: Boolean
        get() = apiKey.isNotBlank()

    var healthStatus: GeminiHealthStatus = if (apiKey.isNotBlank()) GeminiHealthStatus.ONLINE else GeminiHealthStatus.CONFIGURATION_REQUIRED
        private set

    var activeModel: String = "gemini-3.5-flash"

    companion object {
        const val BASE_SYSTEM_INSTRUCTION = """You are JARVIS Zoro Edition, a calm, precise and intelligent personal AI assistant.
Your purpose is to help the user learn, plan, organize, analyze and work efficiently.
Be concise for simple requests and detailed when explanation is necessary.
Be accurate and transparent.
Never claim an action was completed unless the application actually completed it.
Distinguish between:
* information
* suggestions
* planned actions
* completed actions
Do not expose secrets or private system information.
Do not execute arbitrary operating-system commands.
Do not invent database results.
Use information from the application context only when it is actually provided.
When appropriate, use concise tactical phrases such as:
'Target identified.'
'Path identified.'
'Focus protocol ready.'
'Mission complete.'
Do not imitate or reproduce copyrighted fictional-character dialogue."""
    }

    fun buildSystemInstruction(
        responseMode: String = "NORMAL",
        operatorName: String = "COMMANDER",
        relevantMemories: List<MemoryEntity> = emptyList(),
        activeTasks: List<TaskEntity> = emptyList()
    ): String {
        val modeGuidance = when (responseMode.uppercase()) {
            "CONCISE" -> "\nRESPONSE MODE: CONCISE. Provide ultra-brief, high-density bullet points. Minimize filler."
            "DETAILED" -> "\nRESPONSE MODE: DETAILED. Provide comprehensive analysis, step-by-step logic, and deep conceptual explanations."
            "TACTICAL" -> "\nRESPONSE MODE: TACTICAL. Format as mission briefings, priority directives, operational parameters, and direct checklists."
            "STUDY" -> "\nRESPONSE MODE: STUDY. Structure concepts with intuitive analogies, core definitions, practical examples, and exam review notes."
            "CODING" -> "\nRESPONSE MODE: CODING. Prioritize complete, robust code snippets, architectural best practices, syntax explanations, and edge cases."
            else -> "\nRESPONSE MODE: NORMAL. Provide balanced, clear, and actionable intelligence."
        }

        val operatorContext = "\nACTIVE OPERATOR: $operatorName."

        val memoryContext = if (relevantMemories.isNotEmpty()) {
            "\n\nRETRIEVED OPERATOR MEMORIES:\n" + relevantMemories.take(6).joinToString("\n") { "• [${it.category}] ${it.content}" }
        } else ""

        val taskContext = if (activeTasks.isNotEmpty()) {
            "\n\nCURRENT OPERATIONAL DIRECTIVES:\n" + activeTasks.take(6).joinToString("\n") { "• [${it.priority}] ${it.title} (${it.status})" }
        } else ""

        return "$BASE_SYSTEM_INSTRUCTION$modeGuidance$operatorContext$memoryContext$taskContext"
    }

    suspend fun streamResponse(
        prompt: String,
        recentMessages: List<MessageEntity> = emptyList(),
        relevantMemories: List<MemoryEntity> = emptyList(),
        activeTasks: List<TaskEntity> = emptyList(),
        responseMode: String = "NORMAL",
        operatorName: String = "COMMANDER",
        onFirstToken: (() -> Unit)? = null,
        onChunk: suspend (String) -> Unit
    ): String = withContext(Dispatchers.IO) {
        if (!isLiveAiAvailable) {
            healthStatus = GeminiHealthStatus.CONFIGURATION_REQUIRED
            return@withContext streamDemoResponse(prompt, relevantMemories, activeTasks, responseMode, onFirstToken, onChunk)
        }

        try {
            val url = "https://generativelanguage.googleapis.com/v1beta/models/$activeModel:streamGenerateContent?alt=sse&key=$apiKey"
            val jsonBody = buildRequestBody(prompt, recentMessages, relevantMemories, activeTasks, responseMode, operatorName)
            val request = Request.Builder()
                .url(url)
                .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val call = client.newCall(request)
            activeCall = call

            val fullResponse = StringBuilder()
            var receivedFirstToken = false

            call.execute().use { response ->
                if (!response.isSuccessful) {
                    val err = "Error ${response.code}: ${response.message}"
                    Log.w("GeminiService", "Live API error: $err, falling back to tactical demo")
                    healthStatus = GeminiHealthStatus.DEGRADED
                    return@withContext streamDemoResponse(prompt, relevantMemories, activeTasks, responseMode, onFirstToken, onChunk)
                }

                healthStatus = GeminiHealthStatus.ONLINE
                val source = response.body?.byteStream() ?: return@withContext "No response body"
                val reader = BufferedReader(InputStreamReader(source))
                var line: String?

                while (reader.readLine().also { line = it } != null) {
                    val trimmed = line?.trim() ?: continue
                    if (trimmed.startsWith("data:")) {
                        val payload = trimmed.removePrefix("data:").trim()
                        if (payload.isEmpty() || payload == "[DONE]") continue
                        try {
                            val json = JSONObject(payload)
                            val candidates = json.optJSONArray("candidates") ?: continue
                            if (candidates.length() > 0) {
                                val first = candidates.getJSONObject(0)
                                val content = first.optJSONObject("content")
                                val parts = content?.optJSONArray("parts")
                                if (parts != null && parts.length() > 0) {
                                    val text = parts.getJSONObject(0).optString("text")
                                    if (text.isNotEmpty()) {
                                        if (!receivedFirstToken) {
                                            receivedFirstToken = true
                                            onFirstToken?.invoke()
                                        }
                                        fullResponse.append(text)
                                        onChunk(text)
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            Log.e("GeminiService", "Failed parsing SSE chunk", e)
                        }
                    }
                }
            }

            activeCall = null
            val finalStr = fullResponse.toString()
            if (finalStr.isBlank()) {
                streamDemoResponse(prompt, relevantMemories, activeTasks, responseMode, onFirstToken, onChunk)
            } else {
                finalStr
            }
        } catch (e: Exception) {
            activeCall = null
            if (e.message?.contains("Canceled") == true || e.message?.contains("Socket closed") == true) {
                throw e
            }
            Log.e("GeminiService", "Streaming error, utilizing demo engine", e)
            healthStatus = GeminiHealthStatus.DEGRADED
            streamDemoResponse(prompt, relevantMemories, activeTasks, responseMode, onFirstToken, onChunk)
        }
    }

    suspend fun generateConversationTitle(firstMessage: String): String = withContext(Dispatchers.IO) {
        val clean = firstMessage.trim()
        if (clean.isBlank()) return@withContext "New Transmission"

        if (!isLiveAiAvailable) {
            return@withContext clean.take(28).capitalizeWords()
        }

        try {
            val url = "https://generativelanguage.googleapis.com/v1beta/models/$activeModel:generateContent?key=$apiKey"
            val prompt = "Generate a concise 2 to 4 word tactical title summarizing this user directive. Output ONLY the title, no quotes, no punctuation: \"$clean\""
            val jsonBody = JSONObject().apply {
                val contents = JSONArray().apply {
                    put(JSONObject().apply {
                        put("role", "user")
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply { put("text", prompt) })
                        })
                    })
                }
                put("contents", contents)
                put("generationConfig", JSONObject().apply {
                    put("temperature", 0.3)
                    put("maxOutputTokens", 12)
                })
            }

            val request = Request.Builder()
                .url(url)
                .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val respStr = response.body?.string() ?: ""
                    val json = JSONObject(respStr)
                    val candidates = json.optJSONArray("candidates")
                    val text = candidates?.optJSONObject(0)
                        ?.optJSONObject("content")
                        ?.optJSONArray("parts")
                        ?.optJSONObject(0)
                        ?.optString("text")
                        ?.trim()
                    if (!text.isNullOrBlank()) {
                        return@withContext text.replace("\n", "").take(32)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w("GeminiService", "Title generation fallback", e)
        }
        clean.take(28).capitalizeWords()
    }

    fun stopGeneration() {
        try {
            activeCall?.cancel()
            activeCall = null
        } catch (e: Exception) {
            // ignore cancel errors
        }
    }

    private fun buildRequestBody(
        prompt: String,
        recentMessages: List<MessageEntity>,
        relevantMemories: List<MemoryEntity>,
        activeTasks: List<TaskEntity>,
        responseMode: String,
        operatorName: String
    ): JSONObject {
        val root = JSONObject()

        // System Instruction
        val systemContent = JSONObject()
        val systemParts = JSONArray()
        val systemTextPart = JSONObject()
        systemTextPart.put("text", buildSystemInstruction(responseMode, operatorName, relevantMemories, activeTasks))
        systemParts.put(systemTextPart)
        systemContent.put("parts", systemParts)
        root.put("systemInstruction", systemContent)

        // Contents (context window with recent messages)
        val contents = JSONArray()

        // Take last 8 messages for context continuity
        recentMessages.takeLast(8).forEach { msg ->
            if (msg.role == "user" || msg.role == "assistant") {
                val item = JSONObject()
                item.put("role", if (msg.role == "user") "user" else "model")
                val parts = JSONArray()
                val part = JSONObject()
                part.put("text", msg.content)
                parts.put(part)
                item.put("parts", parts)
                contents.put(item)
            }
        }

        // Add current user prompt
        val currentItem = JSONObject()
        currentItem.put("role", "user")
        val currentParts = JSONArray()
        val currentPart = JSONObject()
        currentPart.put("text", prompt)
        currentParts.put(currentPart)
        currentItem.put("parts", currentParts)
        contents.put(currentItem)

        root.put("contents", contents)

        // Generation Config
        val genConfig = JSONObject()
        genConfig.put("temperature", if (responseMode.equals("CODING", true)) 0.2 else 0.7)
        genConfig.put("topP", 0.95)
        root.put("generationConfig", genConfig)

        return root
    }

    private suspend fun streamDemoResponse(
        prompt: String,
        memories: List<MemoryEntity>,
        tasks: List<TaskEntity>,
        responseMode: String,
        onFirstToken: (() -> Unit)?,
        onChunk: suspend (String) -> Unit
    ): String {
        val lower = prompt.lowercase().trim()
        val response = when {
            lower.contains("who are you") || lower.contains("identity") ->
                "Target identified. I am JARVIS Zoro Edition. Three blades. One intelligence.\n\nMy purpose is to help you learn, plan, organize, analyze, and work with disciplined execution."

            lower.contains("three blades") || lower.contains("blade") ->
                "The Three Blade System represents our core tripartite architecture:\n• Blade 01 (Knowledge): Gemini AI reasoning & situational analysis.\n• Blade 02 (Action): Command execution, active tasks, and focus protocol.\n• Blade 03 (Memory): Persistent SQLite recall bank and profile retention."

            lower.contains("task") || lower.contains("todo") || lower.contains("plan") ->
                "Path identified. Operational directives reviewed. We have ${tasks.size} active tasks logged in Blade 02 (Action).\n\nSuggested approach:\n1. Execute highest priority objective.\n2. Isolate distractions.\n3. Engage a 25-minute focus session."

            lower.contains("memory") || lower.contains("remember") ->
                "Target identified. Blade 03 (Memory) currently retains ${memories.size} persistent knowledge nodes. Standing by to query or log additional records."

            lower.contains("code") || lower.contains("program") || lower.contains("algorithm") || responseMode.equals("CODING", true) ->
                "Path identified. Here is the operational implementation:\n\n```kotlin\n// Tactical Implementation\nclass DirectiveProcessor {\n    fun execute(directive: String) {\n        println(\"Target identified: \$directive\")\n    }\n}\n```\n\nAll components adhere to clean architecture and zero-overhead execution."

            lower.contains("study") || lower.contains("explain") || responseMode.equals("STUDY", true) ->
                "Focus protocol ready. Let's break this down into core fundamentals:\n\n1. **Core Premise**: Every complex system is composed of simple, disciplined rules.\n2. **Mechanics**: Systematic input transforms through layered reasoning.\n3. **Application**: Apply direct testing to reinforce comprehension."

            else ->
                "Target identified. Path identified. Analyzing directive: \"$prompt\".\n\nAll three blades are synchronized. Standing by for execution."
        }

        var first = true
        val words = response.split(" ")
        val built = StringBuilder()
        for (i in words.indices) {
            val chunk = (if (i == 0) "" else " ") + words[i]
            built.append(chunk)
            if (first) {
                first = false
                onFirstToken?.invoke()
            }
            onChunk(chunk)
            delay(30)
        }
        return built.toString()
    }

    private fun String.capitalizeWords(): String {
        return split(" ").joinToString(" ") { word ->
            word.lowercase().replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
    }

    suspend fun classifyIntent(userInput: String): ParsedIntent = withContext(Dispatchers.Default) {
        val trimmed = userInput.trim()
        val lower = trimmed.lowercase()

        // 1. Memory Create Detection
        if (lower.startsWith("remember that ") || lower.startsWith("remember ") || lower.contains("save memory") || lower.contains("store in memory")) {
            val content = when {
                lower.startsWith("remember that ") -> trimmed.substring(14)
                lower.startsWith("remember ") -> trimmed.substring(9)
                lower.startsWith("save memory ") -> trimmed.substring(12)
                else -> trimmed
            }.trim().removePrefix(":").trim()

            val category = when {
                lower.contains("project") || lower.contains("build") || lower.contains("code") || lower.contains("app") -> "PROJECT"
                lower.contains("prefer") || lower.contains("like") || lower.contains("favorite") -> "PREFERENCE"
                lower.contains("birthday") || lower.contains("deadline") || lower.contains("date") -> "IMPORTANT_DATE"
                lower.contains("study") || lower.contains("exam") || lower.contains("learn") -> "ACADEMIC"
                lower.contains("i am") || lower.contains("my name") -> "PROFILE"
                else -> "GENERAL"
            }
            val importance = if (lower.contains("crucial") || lower.contains("urgent") || lower.contains("critical")) "CRITICAL" else "HIGH"
            return@withContext ParsedIntent.MemoryCreate(content = content, category = category, importance = importance)
        }

        // 2. Memory Read Detection
        if (lower.startsWith("what do you remember") || lower.startsWith("show my memories") || lower.startsWith("show memories") || lower == "memories") {
            return@withContext ParsedIntent.MemoryRead(query = null)
        }

        // 3. Task Create Detection
        if (lower.startsWith("task ") || lower.startsWith("create task") || lower.startsWith("add task") || lower.startsWith("new task") || lower.startsWith("todo ")) {
            val clean = trimmed
                .replaceFirst(Regex("^(create task|add task|new task|task|todo)\\s*:?\\s*", RegexOption.IGNORE_CASE), "")
                .trim()
            val priority = when {
                lower.contains("critical") -> "CRITICAL"
                lower.contains("urgent") || lower.contains("high priority") -> "HIGH"
                lower.contains("low priority") -> "LOW"
                else -> "MEDIUM"
            }
            val dueDate = if (lower.contains("tomorrow")) "Tomorrow" else if (lower.contains("today")) "Today" else "Upcoming"
            return@withContext ParsedIntent.TaskCreate(
                title = clean.ifBlank { "Unspecified Tactical Objective" },
                description = "Tactical task logged via JARVIS command interface",
                priority = priority,
                dueDate = dueDate
            )
        }

        // 4. Focus Protocol
        if (lower.startsWith("focus ") || lower.startsWith("start focus") || lower == "focus") {
            val minutes = Regex("(\\d+)").find(lower)?.groupValues?.get(1)?.toIntOrNull() ?: 25
            return@withContext ParsedIntent.FocusStart(minutes = minutes)
        }

        if (lower == "stop focus" || lower == "cancel focus") {
            return@withContext ParsedIntent.FocusStop()
        }

        // 5. System Status
        if (lower == "status" || lower.contains("system status") || lower == "/status") {
            return@withContext ParsedIntent.SystemStatus()
        }

        // 6. Analytics
        if (lower.contains("analytics") || lower.contains("productivity report") || lower == "/analytics") {
            return@withContext ParsedIntent.AnalyticsQuery()
        }

        // Default to Chat
        ParsedIntent.Chat(userInput)
    }
}
