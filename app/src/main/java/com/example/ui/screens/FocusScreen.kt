package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun FocusScreen(
    viewModel: JarvisViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isRunning by viewModel.isFocusRunning.collectAsState()
    val isPaused by viewModel.isFocusPaused.collectAsState()
    val targetMinutes by viewModel.focusTargetMinutes.collectAsState()
    val secondsRemaining by viewModel.focusSecondsRemaining.collectAsState()
    val focusSessions by viewModel.focusSessions.collectAsState()

    var showCustomDialog by remember { mutableStateOf(false) }

    val totalSeconds = targetMinutes * 60
    val progress = if (totalSeconds > 0) (totalSeconds - secondsRemaining).toFloat() / totalSeconds else 0f
    val mins = secondsRemaining / 60
    val secs = secondsRemaining % 60

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(16.dp)
            .testTag("focus_screen"),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack, modifier = Modifier.testTag("focus_back_button")) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = JarvisBright
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
                Column {
                    Text(
                        text = "FOCUS PROTOCOL",
                        color = JarvisBright,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "SINGLE-MINDED COMBAT DISCIPLINE",
                        color = JarvisTextMuted,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Presets row (disabled while running)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(25, 45, 60).forEach { p ->
                val isSelected = targetMinutes == p
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (isSelected) JarvisPrimary else JarvisPanel)
                        .border(1.dp, if (isSelected) JarvisBright else JarvisPanelBorder, RoundedCornerShape(6.dp))
                        .clickable(enabled = !isRunning) {
                            viewModel.focusTargetMinutes.value = p
                            viewModel.focusSecondsRemaining.value = p * 60
                        }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "$p MIN",
                        color = if (isSelected) JarvisBackground else JarvisTextPrimary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Custom Preset
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(6.dp))
                    .background(if (targetMinutes !in listOf(25, 45, 60)) JarvisPrimary else JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(6.dp))
                    .clickable(enabled = !isRunning) { showCustomDialog = true }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "CUSTOM",
                    color = if (targetMinutes !in listOf(25, 45, 60)) JarvisBackground else JarvisTextPrimary,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        // Circular Tactical Countdown Progress Meter
        Box(
            modifier = Modifier.size(220.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val strokeWidth = 10.dp.toPx()
                val radius = (size.minDimension - strokeWidth) / 2f
                val center = Offset(size.width / 2f, size.height / 2f)

                // Track ring
                drawCircle(
                    color = JarvisPanelBorder,
                    radius = radius,
                    center = center,
                    style = Stroke(width = strokeWidth)
                )

                // Tactical ticks around outer rim
                for (i in 0 until 36) {
                    val angle = Math.toRadians((i * 10).toDouble())
                    val tickLen = if (i % 3 == 0) 8.dp.toPx() else 4.dp.toPx()
                    val p1 = Offset(
                        (center.x + (radius + 12.dp.toPx()) * Math.cos(angle)).toFloat(),
                        (center.y + (radius + 12.dp.toPx()) * Math.sin(angle)).toFloat()
                    )
                    val p2 = Offset(
                        (center.x + (radius + 12.dp.toPx() - tickLen) * Math.cos(angle)).toFloat(),
                        (center.y + (radius + 12.dp.toPx() - tickLen) * Math.sin(angle)).toFloat()
                    )
                    drawLine(
                        color = JarvisPanelBorder,
                        start = p1,
                        end = p2,
                        strokeWidth = 1.5f
                    )
                }

                // Active progress arc
                val sweep = progress * 360f
                drawArc(
                    color = if (isRunning) JarvisBright else JarvisPrimary,
                    startAngle = -90f,
                    sweepAngle = sweep,
                    useCenter = false,
                    topLeft = Offset(center.x - radius, center.y - radius),
                    size = Size(radius * 2, radius * 2),
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = String.format("%02d:%02d", mins, secs),
                    color = JarvisTextPrimary,
                    fontSize = 40.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 2.sp
                )
                Text(
                    text = if (isRunning) {
                        if (isPaused) "PAUSED" else "DISCIPLINE ENGAGED"
                    } else "READY",
                    color = if (isRunning) JarvisBright else JarvisTextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        // Timer Controls (Start / Pause / Resume / Stop / Reset)
        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (!isRunning) {
                Button(
                    onClick = { viewModel.startFocus(targetMinutes) },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisPrimary),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .height(48.dp)
                        .testTag("focus_start_button")
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = JarvisBackground)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("INITIATE PROTOCOL", color = JarvisBackground, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
            } else {
                if (isPaused) {
                    Button(
                        onClick = { viewModel.resumeFocus() },
                        colors = ButtonDefaults.buttonColors(containerColor = JarvisBright),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .height(48.dp)
                            .testTag("focus_resume_button")
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = JarvisBackground)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("RESUME", color = JarvisBackground, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    }
                } else {
                    Button(
                        onClick = { viewModel.pauseFocus() },
                        colors = ButtonDefaults.buttonColors(containerColor = JarvisWarning),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .height(48.dp)
                            .testTag("focus_pause_button")
                    ) {
                        Icon(Icons.Default.Pause, contentDescription = null, tint = JarvisBackground)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("PAUSE", color = JarvisBackground, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    }
                }

                Button(
                    onClick = { viewModel.stopFocus() },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisDanger),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .height(48.dp)
                        .testTag("focus_stop_button")
                ) {
                    Icon(Icons.Default.Stop, contentDescription = null, tint = JarvisTextPrimary)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("TERMINATE", color = JarvisTextPrimary, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Session History Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "LOGGED FOCUS PROTOCOLS (${focusSessions.size})",
                color = JarvisBright,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            val totalMins = focusSessions.filter { it.status == "COMPLETED" }.sumOf { it.duration }
            Text(
                text = "$totalMins MINS COMPLETED",
                color = JarvisTextMuted,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            if (focusSessions.isEmpty()) {
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
                            text = "NO FOCUS SESSIONS RECORDED YET",
                            color = JarvisTextMuted,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            } else {
                items(focusSessions) { session ->
                    val dateStr = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault()).format(Date(session.timestamp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(JarvisPanel)
                            .border(1.dp, JarvisPanelBorder, RoundedCornerShape(6.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "${session.durationMinutes} Minutes Focused",
                                    color = JarvisTextPrimary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = dateStr,
                                    color = JarvisTextMuted,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (session.status == "COMPLETED") JarvisBright.copy(alpha = 0.2f) else JarvisDanger.copy(alpha = 0.2f))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = session.status,
                                    color = if (session.status == "COMPLETED") JarvisBright else JarvisDanger,
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Custom minutes dialog
    if (showCustomDialog) {
        var customMinsText by remember { mutableStateOf("30") }
        AlertDialog(
            onDismissRequest = { showCustomDialog = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text("CUSTOM FOCUS DURATION", color = JarvisBright, fontSize = 14.sp, fontFamily = FontFamily.Monospace)
            },
            text = {
                OutlinedTextField(
                    value = customMinsText,
                    onValueChange = { customMinsText = it },
                    label = { Text("Minutes") },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val m = customMinsText.toIntOrNull() ?: 25
                        viewModel.focusTargetMinutes.value = m
                        viewModel.focusSecondsRemaining.value = m * 60
                        showCustomDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisPrimary)
                ) {
                    Text("SET", color = JarvisBackground, fontFamily = FontFamily.Monospace)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCustomDialog = false }) {
                    Text("CANCEL", color = JarvisTextMuted, fontFamily = FontFamily.Monospace)
                }
            }
        )
    }
}
