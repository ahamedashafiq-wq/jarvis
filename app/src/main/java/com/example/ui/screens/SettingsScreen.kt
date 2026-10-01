package com.example.ui.screens

import android.widget.Toast
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.JarvisViewModel
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

@Composable
fun SettingsScreen(
    viewModel: JarvisViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val currentSession by viewModel.currentSession.collectAsState()
    val profile by viewModel.currentProfile.collectAsState()
    val settings by viewModel.currentSettings.collectAsState()
    val isLiveAi = viewModel.geminiService.isLiveAiAvailable
    val isSupabase = viewModel.authManager.isSupabaseConfigured

    var displayName by remember(profile?.display_name) {
        mutableStateOf(profile?.display_name ?: currentSession?.displayName ?: "COMMANDER")
    }

    var speechRate by remember(settings?.voice_rate) {
        mutableFloatStateOf(settings?.voice_rate ?: viewModel.voiceManager.speechRate)
    }
    var speechPitch by remember(settings?.voice_pitch) {
        mutableFloatStateOf(settings?.voice_pitch ?: viewModel.voiceManager.speechPitch)
    }
    var autoSpeak by remember(settings?.auto_speak) {
        mutableStateOf(settings?.auto_speak ?: false)
    }
    var responseMode by remember(settings?.response_mode) {
        mutableStateOf(settings?.response_mode ?: "NORMAL")
    }
    var animationLevel by remember(settings?.animation_level) {
        mutableStateOf(settings?.animation_level ?: "HIGH")
    }
    var activeModel by remember { mutableStateOf(viewModel.geminiService.activeModel) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp)
            .testTag("settings_screen"),
        contentPadding = PaddingValues(bottom = 96.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack, modifier = Modifier.testTag("settings_back_button")) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = JarvisBright
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
                Column {
                    Text(
                        text = "SYSTEM CONFIGURATION",
                        color = JarvisBright,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "CORE PARAMETERS & INTELLIGENCE MATRIX",
                        color = JarvisTextMuted,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Section: Operator Profile
        item {
            SettingsSectionHeader(title = "OPERATOR IDENTIFICATION")
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                    .padding(14.dp)
            ) {
                Column {
                    Text(
                        text = "AUTHENTICATED IDENTITY: ${currentSession?.email ?: "LOCAL USER"}",
                        color = JarvisBright,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "SECURITY ID: ${currentSession?.userId ?: "UNKNOWN"}",
                        color = JarvisTextMuted,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = displayName,
                        onValueChange = { displayName = it },
                        label = { Text("Display Name / Callsign") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = {
                            if (profile != null) {
                                viewModel.updateProfile(profile!!.copy(display_name = displayName))
                                Toast.makeText(context, "Operator profile updated", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = JarvisPrimary),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, tint = JarvisBackground, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("SAVE PROFILE DIRECTIVE", color = JarvisBackground, fontFamily = FontFamily.Monospace, fontSize = 11.sp)
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // Section: AI Intelligence Engine
        item {
            SettingsSectionHeader(title = "GEMINI INTELLIGENCE MATRIX")
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                    .padding(14.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "BACKEND STATUS",
                            color = JarvisTextMuted,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = if (isSupabase) "SUPABASE POSTGRESQL" else "LOCAL MULTI-USER SQLITE",
                            color = if (isSupabase) JarvisBright else JarvisWarning,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "AI ENGINE",
                            color = JarvisTextMuted,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = if (isLiveAi) "GEMINI 3.5 FLASH [LIVE]" else "DEMO MODE [LOCAL SYNAPSE]",
                            color = if (isLiveAi) JarvisBright else JarvisWarning,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "RESPONSE MODE",
                        color = JarvisTextMuted,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("NORMAL", "CONCISE", "DETAILED").forEach { mode ->
                            val isSelected = responseMode == mode
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isSelected) JarvisPrimary else JarvisPanelElevated)
                                    .border(1.dp, if (isSelected) JarvisBright else JarvisPanelBorder, RoundedCornerShape(6.dp))
                                    .clickable {
                                        responseMode = mode
                                        if (settings != null) {
                                            viewModel.updateSettings(settings!!.copy(response_mode = mode))
                                        }
                                    }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = mode,
                                    color = if (isSelected) JarvisBackground else JarvisTextPrimary,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // Section: Voice & Speech Engine
        item {
            SettingsSectionHeader(title = "VOICE PROTOCOL & SYNTHESIS")
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                    .padding(14.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "AUTO-SPEAK RESPONSES",
                                color = JarvisTextPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "Read assistant answers aloud automatically",
                                color = JarvisTextMuted,
                                fontSize = 9.sp
                            )
                        }
                        Switch(
                            checked = autoSpeak,
                            onCheckedChange = {
                                autoSpeak = it
                                if (settings != null) {
                                    viewModel.updateSettings(settings!!.copy(auto_speak = it))
                                }
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = JarvisBackground,
                                checkedTrackColor = JarvisBright,
                                uncheckedTrackColor = JarvisPanelElevated
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "SPEECH RATE: ${String.format("%.1f", speechRate)}x",
                        color = JarvisTextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Slider(
                        value = speechRate,
                        onValueChange = {
                            speechRate = it
                            viewModel.voiceManager.speechRate = it
                            if (settings != null) {
                                viewModel.updateSettings(settings!!.copy(voice_rate = it))
                            }
                        },
                        valueRange = 0.5f..1.5f,
                        colors = SliderDefaults.colors(
                            thumbColor = JarvisBright,
                            activeTrackColor = JarvisPrimary,
                            inactiveTrackColor = JarvisPanelBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "SPEECH PITCH: ${String.format("%.2f", speechPitch)}",
                        color = JarvisTextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Slider(
                        value = speechPitch,
                        onValueChange = {
                            speechPitch = it
                            viewModel.voiceManager.speechPitch = it
                            if (settings != null) {
                                viewModel.updateSettings(settings!!.copy(voice_pitch = it))
                            }
                        },
                        valueRange = 0.6f..1.4f,
                        colors = SliderDefaults.colors(
                            thumbColor = JarvisBright,
                            activeTrackColor = JarvisPrimary,
                            inactiveTrackColor = JarvisPanelBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Button(
                        onClick = {
                            viewModel.voiceManager.speak("Systems nominal. Audio protocol test verified, Commander.")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = JarvisPanelElevated),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = JarvisBright, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("TEST SPEECH OUTPUT", color = JarvisBright, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // Section: Session Control & Data Purge
        item {
            SettingsSectionHeader(title = "SESSION CONTROL & STORAGE")
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                    .padding(14.dp)
            ) {
                Column {
                    Button(
                        onClick = {
                            viewModel.clearAllMemories()
                            Toast.makeText(context, "Memory bank purged", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = JarvisPanelElevated),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, tint = JarvisDanger, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("PURGE PERSISTENT MEMORIES", color = JarvisDanger, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Button(
                        onClick = {
                            viewModel.logout()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = JarvisDanger.copy(alpha = 0.15f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, JarvisDanger, RoundedCornerShape(8.dp))
                            .testTag("settings_logout_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null, tint = JarvisDanger, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("TERMINATE ACTIVE SESSION (LOGOUT)", color = JarvisDanger, fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // System Version info
        item {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "JARVIS — ZORO EDITION v2.0.0",
                    color = JarvisTextMuted,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "THREE BLADES. ONE INTELLIGENCE.",
                    color = JarvisBright,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

@Composable
private fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        color = JarvisBright,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Monospace,
        letterSpacing = 1.2.sp
    )
}
