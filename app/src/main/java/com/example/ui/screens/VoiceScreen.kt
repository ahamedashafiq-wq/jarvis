package com.example.ui.screens

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.JarvisViewModel
import com.example.ui.components.AIOrb
import com.example.ui.components.AIOrbState
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
import com.example.ui.voice.VoiceState

@Composable
fun VoiceScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val voiceState by viewModel.voiceManager.voiceState.collectAsState()
    val liveTranscript by viewModel.voiceManager.liveTranscript.collectAsState()
    val audioLevel by viewModel.voiceManager.audioLevel.collectAsState()
    val aiOrbState by viewModel.aiOrbState.collectAsState()
    val messages by viewModel.currentMessages.collectAsState()
    val lastAssistantMessage = messages.lastOrNull { it.role == "assistant" }?.content ?: "Awaiting verbal directive, Commander."

    val isListening = voiceState == VoiceState.LISTENING
    val isSpeaking = voiceState == VoiceState.SPEAKING

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
            .testTag("voice_screen"),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Status indicator header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "VOICE COMMAND CHANNEL",
                    color = JarvisBright,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "STATUS: ${voiceState.name}",
                    color = when (voiceState) {
                        VoiceState.LISTENING -> JarvisBright
                        VoiceState.SPEAKING -> JarvisPrimary
                        VoiceState.ERROR -> JarvisDanger
                        VoiceState.PROCESSING -> JarvisWarning
                        else -> JarvisTextMuted
                    },
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )
            }

            if (isSpeaking) {
                IconButton(
                    onClick = { viewModel.voiceManager.stopSpeaking() },
                    modifier = Modifier.testTag("voice_stop_speaking_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Stop,
                        contentDescription = "Stop Voice",
                        tint = JarvisDanger,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Large Central AIOrb
        AIOrb(
            state = aiOrbState,
            size = 190.dp,
            audioLevel = audioLevel,
            onClick = {
                if (isListening) {
                    viewModel.voiceManager.stopListening()
                } else {
                    viewModel.voiceManager.startListening { spokenText ->
                        viewModel.sendMessage(spokenText)
                    }
                }
            }
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Tactical Audio Equalizer Visualizer
        VoiceVisualizer(
            isActive = isListening || isSpeaking,
            audioLevel = audioLevel,
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .height(48.dp)
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Live Transcript Box
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(JarvisPanel)
                .border(1.dp, if (isListening) JarvisBright else JarvisPanelBorder, RoundedCornerShape(8.dp))
                .padding(14.dp)
                .testTag("voice_transcript_box")
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "LIVE TRANSCRIPT",
                        color = JarvisBright,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    if (isListening) {
                        Text(
                            text = "RECORDING...",
                            color = JarvisWarning,
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = if (liveTranscript.isNotBlank()) "\"$liveTranscript\"" else if (isListening) "Listening for commands..." else "Tap microphone to speak...",
                    color = if (liveTranscript.isNotBlank()) JarvisTextPrimary else JarvisTextMuted,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Assistant Verbal Response Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(JarvisPanelElevated)
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
                        text = "JARVIS SYNTHESIS OUTPUT",
                        color = JarvisPrimary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    IconButton(
                        onClick = { viewModel.voiceManager.speak(lastAssistantMessage) },
                        modifier = Modifier.size(20.dp)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = "Replay", tint = JarvisBright, modifier = Modifier.size(16.dp))
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = lastAssistantMessage,
                    color = JarvisTextPrimary,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    maxLines = 6
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Main Mic Action Button
        Button(
            onClick = {
                if (isListening) {
                    viewModel.voiceManager.stopListening()
                } else {
                    viewModel.voiceManager.startListening { spoken ->
                        viewModel.sendMessage(spoken)
                    }
                }
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isListening) JarvisDanger else JarvisPrimary,
                contentColor = JarvisBackground
            ),
            shape = CircleShape,
            modifier = Modifier
                .size(72.dp)
                .testTag("voice_main_mic_button")
        ) {
            Icon(
                imageVector = if (isListening) Icons.Default.MicOff else Icons.Default.Mic,
                contentDescription = "Microphone",
                modifier = Modifier.size(32.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Quick Verbal Directives
        Text(
            text = "QUICK VERBAL DIRECTIVES",
            color = JarvisTextMuted,
            fontSize = 10.sp,
            fontFamily = FontFamily.Monospace,
            letterSpacing = 1.sp
        )
        Spacer(modifier = Modifier.height(8.dp))

        listOf(
            "What are my highest priority objectives?",
            "Remember that I am building the Three Blades AI architecture.",
            "Initialize focus protocol for 25 minutes.",
            "What do you remember in persistent storage?"
        ).forEach { prompt ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 3.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(6.dp))
                    .clickable { viewModel.sendMessage(prompt) }
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "› $prompt",
                    color = JarvisTextSecondary,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

@Composable
fun VoiceVisualizer(
    isActive: Boolean,
    audioLevel: Float,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "VoiceVisualizer")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "eqPulse"
    )

    Canvas(modifier = modifier) {
        val barCount = 28
        val spacing = 4.dp.toPx()
        val totalSpacing = spacing * (barCount - 1)
        val barWidth = (size.width - totalSpacing) / barCount
        val maxHeight = size.height

        for (i in 0 until barCount) {
            val factor = if (isActive) {
                val distance = kotlin.math.abs(i - barCount / 2f) / (barCount / 2f)
                val base = (1f - distance).coerceIn(0.1f, 1f)
                val dynamic = if (audioLevel > 0.05f) audioLevel * base else pulse * base * 0.7f
                dynamic.coerceIn(0.12f, 1f)
            } else {
                0.08f
            }

            val barHeight = maxHeight * factor
            val left = i * (barWidth + spacing)
            val top = (maxHeight - barHeight) / 2f

            drawRoundRect(
                color = if (isActive) JarvisBright else JarvisTextMuted.copy(alpha = 0.4f),
                topLeft = Offset(left, top),
                size = Size(barWidth, barHeight),
                cornerRadius = CornerRadius(2.dp.toPx(), 2.dp.toPx())
            )
        }
    }
}
