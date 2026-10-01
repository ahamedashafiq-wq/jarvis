package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.JarvisViewModel
import com.example.ui.SubScreen
import com.example.ui.components.AIOrb
import com.example.ui.components.JarvisScreen
import com.example.ui.components.ThreeBladeSystem
import com.example.ui.theme.JarvisBackground
import com.example.ui.theme.JarvisBright
import com.example.ui.theme.JarvisDanger
import com.example.ui.theme.JarvisPanel
import com.example.ui.theme.JarvisPanelBorder
import com.example.ui.theme.JarvisPanelElevated
import com.example.ui.theme.JarvisPrimary
import com.example.ui.theme.JarvisTextMuted
import com.example.ui.theme.JarvisTextPrimary
import com.example.ui.theme.JarvisTextSecondary
import com.example.ui.theme.JarvisWarning
import java.util.Calendar

@Composable
fun DashboardScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val aiOrbState by viewModel.aiOrbState.collectAsState()
    val tasks by viewModel.allTasks.collectAsState()
    val memories by viewModel.allMemories.collectAsState()
    val systemEvents by viewModel.systemEvents.collectAsState()
    val profile by viewModel.currentProfile.collectAsState()
    val displayName = profile?.display_name?.ifBlank { "COMMANDER" } ?: "COMMANDER"
    val isLiveAi = viewModel.geminiService.isLiveAiAvailable

    val isFocusRunning by viewModel.isFocusRunning.collectAsState()
    val focusSecsRemaining by viewModel.focusSecondsRemaining.collectAsState()

    var showQuickTaskDialog by remember { mutableStateOf(false) }
    var showQuickMemoryDialog by remember { mutableStateOf(false) }

    val activeTasks = tasks.filter { it.status != "COMPLETED" && it.status != "CANCELLED" }
    val greeting = remember {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        when (hour) {
            in 5..11 -> "GOOD MORNING"
            in 12..17 -> "GOOD AFTERNOON"
            else -> "GOOD EVENING"
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp)
            .testTag("dashboard_screen"),
        contentPadding = PaddingValues(bottom = 96.dp)
    ) {
        // 1. Tactical Header & Greeting
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "$greeting, $displayName",
                        color = JarvisTextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        text = "DEFENSIVE GRID STABLE • 3 BLADES SYNCHRONIZED",
                        color = JarvisBright,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 0.8.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(JarvisPanel)
                        .border(1.dp, JarvisPanelBorder, RoundedCornerShape(6.dp))
                        .clickable { viewModel.currentSubScreen.value = SubScreen.PROFILE }
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                        .testTag("dashboard_profile_chip"),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(JarvisBright)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "DOSSIER",
                            color = JarvisBright,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 2. Central AI Core Hero
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(12.dp))
                    .padding(vertical = 16.dp, horizontal = 12.dp)
                    .testTag("dashboard_ai_core_card"),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    AIOrb(
                        state = aiOrbState,
                        size = 130.dp,
                        onClick = { viewModel.currentScreen.value = JarvisScreen.VOICE }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "AI CORE: ${aiOrbState.name}",
                        color = JarvisBright,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "Tap to initialize voice synthesis dialog",
                        color = JarvisTextMuted,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 3. Three Blade System
        item {
            ThreeBladeSystem(
                activeTasksCount = activeTasks.size,
                totalMemoriesCount = memories.size,
                isLiveAi = isLiveAi,
                onBladeClick = { bladeIdx ->
                    when (bladeIdx) {
                        1 -> viewModel.currentScreen.value = JarvisScreen.CHAT
                        2 -> viewModel.currentScreen.value = JarvisScreen.TASKS
                        3 -> viewModel.currentSubScreen.value = SubScreen.MEMORY
                    }
                }
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 4. Quick Action Tactical Tiles
        item {
            Text(
                text = "TACTICAL DIRECTIVES",
                color = JarvisBright,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.2.sp
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickActionTile(
                    title = "ASK JARVIS",
                    icon = Icons.Default.AutoAwesome,
                    color = JarvisPrimary,
                    modifier = Modifier.weight(1f),
                    onClick = { viewModel.currentScreen.value = JarvisScreen.CHAT }
                )
                QuickActionTile(
                    title = "VOICE COMMS",
                    icon = Icons.Default.Mic,
                    color = JarvisBright,
                    modifier = Modifier.weight(1f),
                    onClick = { viewModel.currentScreen.value = JarvisScreen.VOICE }
                )
                QuickActionTile(
                    title = "FOCUS MODE",
                    icon = Icons.Default.HourglassTop,
                    color = JarvisWarning,
                    modifier = Modifier.weight(1f),
                    onClick = { viewModel.currentSubScreen.value = SubScreen.FOCUS }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickActionTile(
                    title = "CREATE TASK",
                    icon = Icons.Default.Add,
                    color = JarvisPrimary,
                    modifier = Modifier.weight(1f),
                    onClick = { showQuickTaskDialog = true }
                )
                QuickActionTile(
                    title = "SAVE MEMORY",
                    icon = Icons.Default.Psychology,
                    color = JarvisBright,
                    modifier = Modifier.weight(1f),
                    onClick = { showQuickMemoryDialog = true }
                )
                QuickActionTile(
                    title = "TERMINAL",
                    icon = Icons.Default.Terminal,
                    color = JarvisTextPrimary,
                    modifier = Modifier.weight(1f),
                    onClick = { viewModel.currentScreen.value = JarvisScreen.COMMANDS }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }

        // 5. Active Focus Protocol status (if active)
        if (isFocusRunning) {
            item {
                val mins = focusSecsRemaining / 60
                val secs = focusSecsRemaining % 60
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(JarvisPanel)
                        .border(1.dp, JarvisWarning, RoundedCornerShape(8.dp))
                        .clickable { viewModel.currentSubScreen.value = SubScreen.FOCUS }
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.HourglassTop,
                                contentDescription = null,
                                tint = JarvisWarning,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "FOCUS PROTOCOL ENGAGED",
                                    color = JarvisWarning,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                                Text(
                                    text = "Target discipline countdown in progress",
                                    color = JarvisTextMuted,
                                    fontSize = 9.sp
                                )
                            }
                        }
                        Text(
                            text = String.format("%02d:%02d", mins, secs),
                            color = JarvisWarning,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }

        // 6. Today's Tactical Tasks
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "ACTIVE OBJECTIVES (${activeTasks.size})",
                    color = JarvisBright,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.2.sp
                )
                TextButton(
                    onClick = { viewModel.currentScreen.value = JarvisScreen.TASKS },
                    modifier = Modifier.testTag("dashboard_view_all_tasks")
                ) {
                    Text(
                        text = "VIEW ALL >",
                        color = JarvisTextSecondary,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
        }

        if (activeTasks.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(JarvisPanel)
                        .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "NO PENDING TASKS • STANDING BY FOR DIRECTIVES",
                        color = JarvisTextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        } else {
            items(activeTasks.take(4)) { task ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 3.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(JarvisPanel)
                        .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                        .clickable { viewModel.toggleTaskComplete(task) }
                        .padding(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (task.status == "COMPLETED") Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                            contentDescription = "Complete task",
                            tint = if (task.status == "COMPLETED") JarvisBright else JarvisTextMuted,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = task.title,
                                color = JarvisTextPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            if (task.dueDate.isNotBlank()) {
                                Text(
                                    text = "DUE: ${task.dueDate}",
                                    color = JarvisTextMuted,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(
                                    when (task.priority) {
                                        "CRITICAL" -> JarvisDanger.copy(alpha = 0.2f)
                                        "HIGH" -> JarvisWarning.copy(alpha = 0.2f)
                                        else -> JarvisPrimary.copy(alpha = 0.2f)
                                    }
                                )
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = task.priority,
                                color = when (task.priority) {
                                    "CRITICAL" -> JarvisDanger
                                    "HIGH" -> JarvisWarning
                                    else -> JarvisPrimary
                                },
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }
        }

        // 7. Recent Tactical Telemetry Log snippet
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "TACTICAL TELEMETRY STREAM",
                    color = JarvisBright,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.2.sp
                )
                TextButton(onClick = { viewModel.currentSubScreen.value = SubScreen.LOGS }) {
                    Text(
                        text = "CONSOLE >",
                        color = JarvisTextSecondary,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                    .padding(10.dp)
            ) {
                Column {
                    if (systemEvents.isEmpty()) {
                        Text(
                            text = "SECURITY ISOLATION ACTIVE • SYSTEM HEALTH NOMINAL",
                            color = JarvisTextMuted,
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    } else {
                        systemEvents.take(3).forEach { event ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "[${event.event_type}]",
                                    color = JarvisBright,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = event.payload.ifBlank { "Event logged" },
                                    color = JarvisTextSecondary,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Quick Task Dialog
    if (showQuickTaskDialog) {
        var taskTitle by remember { mutableStateOf("") }
        var taskPriority by remember { mutableStateOf("HIGH") }
        AlertDialog(
            onDismissRequest = { showQuickTaskDialog = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text("LOG TACTICAL OBJECTIVE", color = JarvisBright, fontSize = 14.sp, fontFamily = FontFamily.Monospace)
            },
            text = {
                Column {
                    OutlinedTextField(
                        value = taskTitle,
                        onValueChange = { taskTitle = it },
                        label = { Text("Task Description") },
                        modifier = Modifier.fillMaxWidth().testTag("quick_task_input")
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("LOW", "MEDIUM", "HIGH", "CRITICAL").forEach { prio ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (taskPriority == prio) JarvisPrimary else JarvisPanel)
                                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(4.dp))
                                    .clickable { taskPriority = prio }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = prio,
                                    color = if (taskPriority == prio) JarvisBackground else JarvisTextPrimary,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (taskTitle.isNotBlank()) {
                            viewModel.createTask(taskTitle, "", taskPriority, "Today")
                        }
                        showQuickTaskDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisPrimary)
                ) {
                    Text("ENGAGE", color = JarvisBackground, fontFamily = FontFamily.Monospace)
                }
            },
            dismissButton = {
                TextButton(onClick = { showQuickTaskDialog = false }) {
                    Text("CANCEL", color = JarvisTextMuted, fontFamily = FontFamily.Monospace)
                }
            }
        )
    }

    // Quick Memory Dialog
    if (showQuickMemoryDialog) {
        var memContent by remember { mutableStateOf("") }
        var memCategory by remember { mutableStateOf("PROJECT") }
        AlertDialog(
            onDismissRequest = { showQuickMemoryDialog = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text("STORE PERSISTENT MEMORY", color = JarvisBright, fontSize = 14.sp, fontFamily = FontFamily.Monospace)
            },
            text = {
                Column {
                    OutlinedTextField(
                        value = memContent,
                        onValueChange = { memContent = it },
                        label = { Text("Memory Fact or Preference") },
                        modifier = Modifier.fillMaxWidth().testTag("quick_memory_input")
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        listOf("PROJECT", "PREFERENCE", "PROFILE", "GENERAL").forEach { cat ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (memCategory == cat) JarvisBright else JarvisPanel)
                                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(4.dp))
                                    .clickable { memCategory = cat }
                                    .padding(horizontal = 6.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = cat,
                                    color = if (memCategory == cat) JarvisBackground else JarvisTextPrimary,
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (memContent.isNotBlank()) {
                            viewModel.createMemory(memContent, memCategory, "HIGH", true)
                        }
                        showQuickMemoryDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisBright)
                ) {
                    Text("COMMIT", color = JarvisBackground, fontFamily = FontFamily.Monospace)
                }
            },
            dismissButton = {
                TextButton(onClick = { showQuickMemoryDialog = false }) {
                    Text("CANCEL", color = JarvisTextMuted, fontFamily = FontFamily.Monospace)
                }
            }
        )
    }
}

@Composable
private fun QuickActionTile(
    title: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(JarvisPanel)
            .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(vertical = 12.dp, horizontal = 8.dp)
            .testTag("action_${title.lowercase().replace(" ", "_")}"),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = color,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = title,
                color = JarvisTextPrimary,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.4.sp,
                maxLines = 1
            )
        }
    }
}
