package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
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

@Database(
    entities = [
        UserAccountEntity::class,
        ProfileEntity::class,
        ConversationEntity::class,
        MessageEntity::class,
        MemoryEntity::class,
        TaskEntity::class,
        CommandEntity::class,
        SettingsEntity::class,
        AnalyticsEventEntity::class,
        VoiceSessionEntity::class,
        NotificationEntity::class,
        SystemEventEntity::class,
        FocusSessionEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class JarvisDatabase : RoomDatabase() {
    abstract fun jarvisDao(): JarvisDao

    companion object {
        @Volatile
        private var INSTANCE: JarvisDatabase? = null

        fun getInstance(context: Context): JarvisDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    JarvisDatabase::class.java,
                    "jarvis_zoro_database"
                )
                    .fallbackToDestructiveMigration(true)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
