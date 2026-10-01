package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.AnalyticsEventEntity
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
import com.example.data.model.UserAccountEntity
import com.example.data.model.VoiceSessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface JarvisDao {

    // --- User Accounts (Local Auth / Sandbox) ---
    @Query("SELECT * FROM user_accounts WHERE email = :email LIMIT 1")
    suspend fun getUserAccountByEmail(email: String): UserAccountEntity?

    @Query("SELECT * FROM user_accounts WHERE id = :id LIMIT 1")
    suspend fun getUserAccountById(id: String): UserAccountEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserAccount(user: UserAccountEntity)

    // --- Profiles ---
    @Query("SELECT * FROM profiles WHERE user_id = :userId LIMIT 1")
    fun getProfile(userId: String): Flow<ProfileEntity?>

    @Query("SELECT * FROM profiles WHERE user_id = :userId LIMIT 1")
    suspend fun getProfileSync(userId: String): ProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfile(profile: ProfileEntity)

    @Update
    suspend fun updateProfile(profile: ProfileEntity)

    // --- Settings ---
    @Query("SELECT * FROM settings WHERE user_id = :userId LIMIT 1")
    fun getSettings(userId: String): Flow<SettingsEntity?>

    @Query("SELECT * FROM settings WHERE user_id = :userId LIMIT 1")
    suspend fun getSettingsSync(userId: String): SettingsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSettings(settings: SettingsEntity)

    @Update
    suspend fun updateSettings(settings: SettingsEntity)

    // --- Conversations ---
    @Query("SELECT * FROM conversations WHERE user_id = :userId ORDER BY updated_at DESC")
    fun getConversationsForUser(userId: String): Flow<List<ConversationEntity>>

    @Query("SELECT * FROM conversations WHERE id = :id AND user_id = :userId LIMIT 1")
    suspend fun getConversationById(id: String, userId: String): ConversationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConversation(conversation: ConversationEntity)

    @Update
    suspend fun updateConversation(conversation: ConversationEntity)

    @Query("DELETE FROM conversations WHERE id = :id AND user_id = :userId")
    suspend fun deleteConversation(id: String, userId: String)

    @Query("DELETE FROM conversations WHERE user_id = :userId")
    suspend fun clearConversationsForUser(userId: String)

    // --- Messages ---
    @Query("SELECT * FROM messages WHERE conversation_id = :conversationId AND user_id = :userId ORDER BY created_at ASC")
    fun getMessagesForConversation(conversationId: String, userId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE conversation_id = :conversationId AND user_id = :userId ORDER BY created_at ASC")
    suspend fun getMessagesList(conversationId: String, userId: String): List<MessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Update
    suspend fun updateMessage(message: MessageEntity)

    @Query("DELETE FROM messages WHERE id = :id AND user_id = :userId")
    suspend fun deleteMessage(id: String, userId: String)

    @Query("DELETE FROM messages WHERE conversation_id = :conversationId AND user_id = :userId")
    suspend fun deleteMessagesForConversation(conversationId: String, userId: String)

    @Query("SELECT COUNT(*) FROM messages WHERE user_id = :userId")
    fun getTotalMessageCount(userId: String): Flow<Int>

    // --- Memories ---
    @Query("SELECT * FROM memories WHERE user_id = :userId ORDER BY pinned DESC, created_at DESC")
    fun getMemoriesForUser(userId: String): Flow<List<MemoryEntity>>

    @Query("SELECT * FROM memories WHERE user_id = :userId ORDER BY pinned DESC, created_at DESC")
    suspend fun getMemoriesListForUser(userId: String): List<MemoryEntity>

    @Query("SELECT * FROM memories WHERE user_id = :userId AND category = :category ORDER BY pinned DESC, created_at DESC")
    fun getMemoriesByCategory(userId: String, category: String): Flow<List<MemoryEntity>>

    @Query("SELECT * FROM memories WHERE user_id = :userId AND content LIKE '%' || :query || '%' ORDER BY created_at DESC")
    fun searchMemories(userId: String, query: String): Flow<List<MemoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMemory(memory: MemoryEntity)

    @Update
    suspend fun updateMemory(memory: MemoryEntity)

    @Query("DELETE FROM memories WHERE id = :id AND user_id = :userId")
    suspend fun deleteMemoryById(id: String, userId: String)

    @Query("DELETE FROM memories WHERE user_id = :userId")
    suspend fun clearMemoriesForUser(userId: String)

    @Query("SELECT COUNT(*) FROM memories WHERE user_id = :userId")
    fun getTotalMemoryCount(userId: String): Flow<Int>

    // --- Tasks ---
    @Query("SELECT * FROM tasks WHERE user_id = :userId ORDER BY CASE priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, created_at DESC")
    fun getTasksForUser(userId: String): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE user_id = :userId AND status != 'COMPLETED' AND status != 'CANCELLED' ORDER BY CASE priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, created_at DESC")
    suspend fun getActiveTasksList(userId: String): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE id = :id AND user_id = :userId LIMIT 1")
    suspend fun getTaskById(id: String, userId: String): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :id AND user_id = :userId")
    suspend fun deleteTaskById(id: String, userId: String)

    @Query("UPDATE tasks SET status = :status, completed_at = :completedAt, updated_at = :updatedAt WHERE id = :id AND user_id = :userId")
    suspend fun updateTaskStatus(id: String, userId: String, status: String, completedAt: Long?, updatedAt: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM tasks WHERE user_id = :userId")
    fun getTotalTaskCount(userId: String): Flow<Int>

    @Query("SELECT COUNT(*) FROM tasks WHERE user_id = :userId AND status = 'COMPLETED'")
    fun getCompletedTaskCount(userId: String): Flow<Int>

    // --- Commands ---
    @Query("SELECT * FROM commands WHERE user_id = :userId ORDER BY created_at DESC LIMIT 50")
    fun getCommandsForUser(userId: String): Flow<List<CommandEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCommand(command: CommandEntity)

    @Query("DELETE FROM commands WHERE user_id = :userId")
    suspend fun clearCommandsForUser(userId: String)

    // --- Analytics Events ---
    @Query("SELECT * FROM analytics_events WHERE user_id = :userId ORDER BY created_at DESC LIMIT 100")
    fun getAnalyticsEventsForUser(userId: String): Flow<List<AnalyticsEventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnalyticsEvent(event: AnalyticsEventEntity)

    // --- Voice Sessions ---
    @Query("SELECT * FROM voice_sessions WHERE user_id = :userId ORDER BY started_at DESC")
    fun getVoiceSessionsForUser(userId: String): Flow<List<VoiceSessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVoiceSession(session: VoiceSessionEntity)

    // --- Notifications ---
    @Query("SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT 50")
    fun getNotificationsForUser(userId: String): Flow<List<NotificationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: NotificationEntity)

    @Query("UPDATE notifications SET `read` = 1 WHERE id = :id AND user_id = :userId")
    suspend fun markNotificationRead(id: String, userId: String)

    // --- Focus Sessions ---
    @Query("SELECT * FROM focus_sessions WHERE user_id = :userId ORDER BY started_at DESC")
    fun getFocusSessionsForUser(userId: String): Flow<List<FocusSessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFocusSession(session: FocusSessionEntity)

    // --- System Events ---
    @Query("SELECT * FROM system_events WHERE user_id = :userId ORDER BY created_at DESC LIMIT 100")
    fun getSystemEventsForUser(userId: String): Flow<List<SystemEventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSystemEvent(event: SystemEventEntity)
}
