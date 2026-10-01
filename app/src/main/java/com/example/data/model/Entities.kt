package com.example.data.model

import androidx.room.Entity
import androidx.room.Ignore
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

typealias CommandLogEntity = CommandEntity

@Entity(
    tableName = "user_accounts",
    indices = [Index(value = ["email"], unique = true)]
)
data class UserAccountEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val email: String,
    val passwordHash: String,
    val displayName: String,
    val role: String = "OPERATOR",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "profiles",
    indices = [Index(value = ["user_id"], unique = true)]
)
data class ProfileEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val display_name: String,
    val avatar_url: String? = null,
    val created_at: Long = System.currentTimeMillis(),
    val updated_at: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "conversations",
    indices = [Index(value = ["user_id"]), Index(value = ["updated_at"])]
)
data class ConversationEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val title: String,
    val created_at: Long = System.currentTimeMillis(),
    val updated_at: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "messages",
    indices = [
        Index(value = ["conversation_id"]),
        Index(value = ["user_id"]),
        Index(value = ["created_at"])
    ]
)
data class MessageEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val conversation_id: String,
    val user_id: String,
    val role: String, // "user", "assistant", "system"
    val content: String,
    val metadata: String? = null,
    val created_at: Long = System.currentTimeMillis(),
    val isStreaming: Boolean = false,
    val intentTag: String? = null
) {
    @get:Ignore
    val timestamp: Long get() = created_at

    @get:Ignore
    val conversationId: String get() = conversation_id
}

@Entity(
    tableName = "memories",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["category"]),
        Index(value = ["created_at"])
    ]
)
data class MemoryEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val content: String,
    val category: String = "GENERAL", // PROFILE, PREFERENCE, PROJECT, ACADEMIC, IMPORTANT_DATE, GENERAL
    val importance: String = "MEDIUM", // LOW, MEDIUM, HIGH, CRITICAL
    val source: String = "USER",
    val pinned: Boolean = false,
    val created_at: Long = System.currentTimeMillis(),
    val updated_at: Long = System.currentTimeMillis()
) {
    @get:Ignore
    val isPinned: Boolean get() = pinned
}

@Entity(
    tableName = "tasks",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["status"]),
        Index(value = ["priority"]),
        Index(value = ["due_date"]),
        Index(value = ["created_at"])
    ]
)
data class TaskEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val title: String,
    val description: String = "",
    val priority: String = "MEDIUM", // LOW, MEDIUM, HIGH, CRITICAL
    val status: String = "TODO", // TODO, IN_PROGRESS, COMPLETED, CANCELLED
    val category: String = "GENERAL",
    val due_date: String = "",
    val created_at: Long = System.currentTimeMillis(),
    val updated_at: Long = System.currentTimeMillis(),
    val completed_at: Long? = null
) {
    @get:Ignore
    val dueDate: String get() = due_date
}

@Entity(
    tableName = "commands",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["created_at"])
    ]
)
data class CommandEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val command: String,
    val command_type: String = "CLI",
    val status: String = "SUCCESS", // VALIDATING, EXECUTING, SUCCESS, ERROR
    val result: String = "",
    val execution_time: Long = 0L,
    val created_at: Long = System.currentTimeMillis()
) {
    @get:Ignore
    val output: String get() = result

    @get:Ignore
    val timestamp: Long get() = created_at
}

@Entity(
    tableName = "settings",
    indices = [Index(value = ["user_id"], unique = true)]
)
data class SettingsEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val assistant_name: String = "JARVIS",
    val response_mode: String = "NORMAL",
    val voice_enabled: Boolean = true,
    val voice_rate: Float = 1.0f,
    val voice_volume: Float = 1.0f,
    val voice_pitch: Float = 1.0f,
    val theme: String = "ZORO",
    val animation_level: String = "HIGH",
    val reduced_motion: Boolean = false,
    val auto_speak: Boolean = false,
    val created_at: Long = System.currentTimeMillis(),
    val updated_at: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "analytics_events",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["event_type"]),
        Index(value = ["created_at"])
    ]
)
data class AnalyticsEventEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val event_type: String,
    val event_data: String = "{}",
    val created_at: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "voice_sessions",
    indices = [Index(value = ["user_id"])]
)
data class VoiceSessionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val started_at: Long = System.currentTimeMillis(),
    val ended_at: Long? = null,
    val duration: Long = 0L,
    val transcript: String = ""
)

@Entity(
    tableName = "notifications",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["read"]),
        Index(value = ["created_at"])
    ]
)
data class NotificationEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val title: String,
    val message: String,
    val type: String = "INFO",
    val read: Boolean = false,
    val created_at: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "system_events",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["created_at"])
    ]
)
data class SystemEventEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val event_type: String,
    val payload: String = "",
    val created_at: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "focus_sessions",
    indices = [
        Index(value = ["user_id"]),
        Index(value = ["task_id"]),
        Index(value = ["started_at"])
    ]
)
data class FocusSessionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val user_id: String,
    val task_id: String? = null,
    val duration: Int = 25,
    val started_at: Long = System.currentTimeMillis(),
    val completed_at: Long? = null,
    val status: String = "COMPLETED" // COMPLETED, ABORTED
) {
    @get:Ignore
    val durationMinutes: Int get() = duration

    @get:Ignore
    val timestamp: Long get() = started_at
}
