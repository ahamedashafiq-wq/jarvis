package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.AIOrb
import com.example.ui.components.AIOrbState
import com.example.ui.theme.JarvisBackground
import com.example.ui.theme.JarvisBright
import com.example.ui.theme.JarvisPanel
import com.example.ui.theme.JarvisPanelBorder
import com.example.ui.theme.JarvisPrimary
import com.example.ui.theme.JarvisTextMuted
import com.example.ui.theme.JarvisTextPrimary
import com.example.ui.theme.JarvisTextSecondary
import kotlinx.coroutines.delay

@Composable
fun BootScreen(
    onComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val bootSteps = remember {
        listOf(
            "INITIALIZING JARVIS...",
            "AI CORE ........ ONLINE",
            "GEMINI .......... ONLINE",
            "MEMORY .......... ONLINE",
            "VOICE ........... READY",
            "DATABASE ........ CONNECTED",
            "COMMAND SYSTEM .. READY",
            "SYSTEM STATUS: ONLINE"
        )
    }

    var currentStep by remember { mutableIntStateOf(0) }
    var showIntroFinal by remember { androidx.compose.runtime.mutableStateOf(false) }

    LaunchedEffect(Unit) {
        for (i in bootSteps.indices) {
            currentStep = i + 1
            delay(280)
        }
        delay(400)
        showIntroFinal = true
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(24.dp)
            .testTag("boot_screen"),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxWidth()
        ) {
            AIOrb(
                state = if (showIntroFinal) AIOrbState.SUCCESS else AIOrbState.EXECUTING,
                size = 140.dp
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Terminal Boot Log
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                    .padding(16.dp)
            ) {
                Column {
                    bootSteps.take(currentStep).forEach { step ->
                        Text(
                            text = "> $step",
                            color = if (step.contains("ONLINE") || step.contains("READY") || step.contains("CONNECTED")) JarvisBright else JarvisTextSecondary,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(vertical = 2.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            AnimatedVisibility(
                visible = showIntroFinal,
                enter = fadeIn() + slideInVertically()
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "JARVIS",
                        color = JarvisTextPrimary,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 2.sp
                    )
                    Text(
                        text = "ZORO EDITION",
                        color = JarvisBright,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "THREE BLADES. ONE INTELLIGENCE.",
                        color = JarvisTextMuted,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )

                    Spacer(modifier = Modifier.height(28.dp))

                    Button(
                        onClick = onComplete,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = JarvisPrimary,
                            contentColor = JarvisBackground
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth(0.85f)
                            .height(48.dp)
                            .testTag("enter_command_center_button")
                    ) {
                        Text(
                            text = "ACTIVATE COMMAND CENTER",
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            if (!showIntroFinal) {
                Spacer(modifier = Modifier.height(20.dp))
                OutlinedButton(
                    onClick = onComplete,
                    shape = RoundedCornerShape(6.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = JarvisTextMuted),
                    modifier = Modifier.testTag("skip_intro_button")
                ) {
                    Text(
                        text = "SKIP INTRO",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}
