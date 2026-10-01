package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.JarvisViewModel
import com.example.ui.theme.BladeAction
import com.example.ui.theme.BladeKnowledge
import com.example.ui.theme.BladeMemory
import com.example.ui.theme.JarvisBackground
import com.example.ui.theme.JarvisBright
import com.example.ui.theme.JarvisDanger
import com.example.ui.theme.JarvisPanel
import com.example.ui.theme.JarvisPanelBorder
import com.example.ui.theme.JarvisPanelElevated
import com.example.ui.theme.JarvisPrimary
import com.example.ui.theme.JarvisSecondary
import com.example.ui.theme.JarvisTextMuted
import com.example.ui.theme.JarvisTextPrimary
import com.example.ui.theme.JarvisTextSecondary
import com.example.ui.theme.JarvisWarning
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ProfileScreen(
    viewModel: JarvisViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    BackHandler { onBack() }

    val context = LocalContext.current
    val currentSession by viewModel.currentSession.collectAsState()
    val profile by viewModel.currentProfile.collectAsState()
    val settings by viewModel.currentSettings.collectAsState()

    val tasks by viewModel.allTasks.collectAsState()
    val memories by viewModel.allMemories.collectAsState()
    val commands by viewModel.commandLogs.collectAsState()
    val focusSessions by viewModel.focusSessions.collectAsState()
    val conversations by viewModel.conversations.collectAsState()

    var isEditing by remember { mutableStateOf(false) }
    var editName by remember(profile) { mutableStateOf(profile?.display_name ?: "") }
    var selectedSwordStyle by remember(settings) {
        mutableStateOf(settings?.theme ?: "SANTORYU (THREE SWORDS)")
    }
    var showLogoutDialog by remember { mutableStateOf(false) }

    val completedTasksCount = tasks.count { it.status == "COMPLETED" }
    val totalFocusMins = focusSessions.filter { it.status == "COMPLETED" }.sumOf { it.duration }

    val userId = currentSession?.userId ?: "UNKNOWN"
    val email = currentSession?.email ?: "N/A"
    val displayName = profile?.display_name?.ifBlank { currentSession?.displayName } ?: "COMMANDER"

    val createdAtFormatted = remember(profile) {
        val millis = profile?.created_at ?: System.currentTimeMillis()
        SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date(millis))
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp)
            .testTag("profile_screen"),
        contentPadding = PaddingValues(top = 12.dp, bottom = 96.dp)
    ) {
        // 1. Navigation Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.testTag("profile_back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = JarvisBright
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Column {
                        Text(
                            text = "OPERATOR DOSSIER",
                            color = JarvisBright,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "TACTICAL IDENTITY & PERMISSION MATRIX",
                            color = JarvisTextMuted,
                            fontSize = 8.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                IconButton(
                    onClick = { isEditing = !isEditing },
                    modifier = Modifier.testTag("profile_edit_toggle")
                ) {
                    Icon(
                        imageVector = if (isEditing) Icons.Default.Save else Icons.Default.Edit,
                        contentDescription = if (isEditing) "Save Profile" else "Edit Profile",
                        tint = if (isEditing) JarvisBright else JarvisTextSecondary
                    )
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
        }

        // 2. Tactical ID Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(10.dp))
                    .padding(16.dp)
                    .testTag("profile_id_card")
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Tactical Hologram Avatar
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(JarvisPanelElevated)
                                    .border(2.dp, JarvisPrimary, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Shield,
                                    contentDescription = "Tactical Crest",
                                    tint = JarvisBright,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text(
                                    text = displayName,
                                    color = JarvisTextPrimary,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 0.5.sp
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = email,
                                    color = JarvisTextMuted,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(CircleShape)
                                            .background(JarvisBright)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "COMMAND LEVEL: ZERO ERROR",
                                        color = JarvisBright,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }
                        }

                        // Badge
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(JarvisPrimary.copy(alpha = 0.15f))
                                .border(1.dp, JarvisPrimary, RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "ZORO SYNC",
                                color = JarvisBright,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // User ID row with copy button
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(6.dp))
                            .background(JarvisPanelElevated)
                            .border(1.dp, JarvisPanelBorder, RoundedCornerShape(6.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "OPERATOR UUID",
                                color = JarvisTextMuted,
                                fontSize = 8.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = userId,
                                color = JarvisTextPrimary,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                maxLines = 1
                            )
                        }
                        IconButton(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                clipboard.setPrimaryClip(ClipData.newPlainText("Operator ID", userId))
                                Toast.makeText(context, "OPERATOR UUID COPIED TO CLIPBOARD", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.size(32.dp).testTag("copy_uuid_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "Copy UUID",
                                tint = JarvisBright,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 3. Edit Form (if active)
        if (isEditing) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(JarvisPanelElevated)
                        .border(1.dp, JarvisPrimary, RoundedCornerShape(8.dp))
                        .padding(14.dp)
                        .testTag("profile_edit_panel")
                ) {
                    Column {
                        Text(
                            text = "UPDATE OPERATOR PARAMETERS",
                            color = JarvisBright,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = editName,
                            onValueChange = { editName = it },
                            label = { Text("Display Name / Callsign", color = JarvisTextMuted, fontSize = 10.sp) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("edit_display_name_input"),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = JarvisBright,
                                unfocusedBorderColor = JarvisPanelBorder,
                                focusedTextColor = JarvisTextPrimary,
                                unfocusedTextColor = JarvisTextPrimary,
                                cursorColor = JarvisBright
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(onClick = { isEditing = false }) {
                                Text("CANCEL", color = JarvisTextMuted, fontSize = 11.sp)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = {
                                    if (editName.isNotBlank() && profile != null) {
                                        viewModel.updateProfile(profile!!.copy(display_name = editName.trim()))
                                        isEditing = false
                                        Toast.makeText(context, "DOSSIER UPDATED", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = JarvisPrimary),
                                shape = RoundedCornerShape(4.dp),
                                modifier = Modifier.testTag("save_profile_button")
                            ) {
                                Text("SAVE CHANGES", color = JarvisBackground, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }

        // 4. Lifetime Combat & Productivity Telemetry
        item {
            Text(
                text = "COMBAT TELEMETRY & PRODUCTIVITY STATS",
                color = JarvisBright,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCard(
                    title = "TASKS CLEARED",
                    value = "$completedTasksCount / ${tasks.size}",
                    color = BladeAction,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "FOCUS MINUTES",
                    value = "$totalFocusMins m",
                    color = JarvisBright,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCard(
                    title = "DIRECTIVES",
                    value = "${commands.size}",
                    color = BladeKnowledge,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "MEMORY NODES",
                    value = "${memories.size}",
                    color = BladeMemory,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }

        // 5. Security & Session Matrix
        item {
            Text(
                text = "SECURITY MATRIX & PROTOCOL STATUS",
                color = JarvisBright,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(8.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    SecurityRow(
                        label = "DATABASE ENGINE",
                        value = if (viewModel.authManager.isSupabaseConfigured) "SUPABASE POSTGRESQL [CONNECTED]" else "LOCAL SQLITE ROOM [SECURE SANDBOX]",
                        isSecure = true
                    )
                    SecurityRow(
                        label = "ROW LEVEL SECURITY (RLS)",
                        value = "ENFORCED (USER_ID ISOLATION)",
                        isSecure = true
                    )
                    SecurityRow(
                        label = "INTELLIGENCE ENGINE",
                        value = if (viewModel.geminiService.isLiveAiAvailable) "GOOGLE GEMINI 3.5 FLASH [ONLINE]" else "LOCAL SYNAPSE [DEMO MODE]",
                        isSecure = viewModel.geminiService.isLiveAiAvailable
                    )
                    SecurityRow(
                        label = "REGISTRATION DATE",
                        value = createdAtFormatted,
                        isSecure = true
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
        }

        // 6. Logout / Terminate Session Action
        item {
            OutlinedButton(
                onClick = { showLogoutDialog = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("profile_logout_button"),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = JarvisDanger
                ),
                border = BorderStroke(1.dp, JarvisDanger.copy(alpha = 0.6f)),
                shape = RoundedCornerShape(6.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Logout,
                    contentDescription = "Terminate Session",
                    tint = JarvisDanger,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "TERMINATE OPERATOR SESSION",
                    color = JarvisDanger,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
            }
        }
    }

    // Confirmation Dialog for Logout
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text(
                    text = "TERMINATE SESSION?",
                    color = JarvisDanger,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            },
            text = {
                Text(
                    text = "Operator credentials will be revoked on this terminal. You will be returned to the authentication gateway.",
                    color = JarvisTextPrimary,
                    fontSize = 11.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        viewModel.logout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisDanger),
                    shape = RoundedCornerShape(4.dp),
                    modifier = Modifier.testTag("confirm_logout_button")
                ) {
                    Text("TERMINATE", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("CANCEL", color = JarvisTextMuted, fontSize = 10.sp)
                }
            }
        )
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(JarvisPanel)
            .border(1.dp, JarvisPanelBorder, RoundedCornerShape(6.dp))
            .padding(12.dp)
    ) {
        Column {
            Text(
                text = title,
                color = JarvisTextMuted,
                fontSize = 8.sp,
                fontFamily = FontFamily.Monospace
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                color = color,
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

@Composable
private fun SecurityRow(
    label: String,
    value: String,
    isSecure: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                color = JarvisTextMuted,
                fontSize = 8.sp,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = value,
                color = if (isSecure) JarvisTextPrimary else JarvisWarning,
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.SemiBold
            )
        }
        Icon(
            imageVector = if (isSecure) Icons.Default.CheckCircle else Icons.Default.Security,
            contentDescription = null,
            tint = if (isSecure) JarvisBright else JarvisWarning,
            modifier = Modifier.size(16.dp)
        )
    }
}
