package com.example.ui.screens

import androidx.compose.foundation.Canvas
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
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
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
import com.example.ui.theme.JarvisPanel
import com.example.ui.theme.JarvisPanelBorder
import com.example.ui.theme.JarvisPanelElevated
import com.example.ui.theme.JarvisPrimary
import com.example.ui.theme.JarvisTextMuted
import com.example.ui.theme.JarvisTextPrimary
import com.example.ui.theme.JarvisTextSecondary
import com.example.ui.theme.JarvisWarning

@Composable
fun AnalyticsScreen(
    viewModel: JarvisViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val messages by viewModel.currentMessages.collectAsState()
    val tasks by viewModel.allTasks.collectAsState()
    val memories by viewModel.allMemories.collectAsState()
    val commands by viewModel.commandLogs.collectAsState()
    val focusSessions by viewModel.focusSessions.collectAsState()

    var selectedTimeframe by remember { mutableStateOf("TODAY") }
    val timeframes = listOf("TODAY", "7 DAYS", "30 DAYS")

    val completedTasks = tasks.count { it.status == "COMPLETED" }
    val totalFocusMins = focusSessions.filter { it.status == "COMPLETED" }.sumOf { it.duration }
    val totalDirectives = messages.size + commands.size

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp)
            .testTag("analytics_screen"),
        contentPadding = PaddingValues(bottom = 96.dp)
    ) {
        // Header
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack, modifier = Modifier.testTag("analytics_back_button")) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = JarvisBright
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
                Column {
                    Text(
                        text = "TACTICAL ANALYTICS",
                        color = JarvisBright,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "OPERATIONAL PERFORMANCE & DISCIPLINE METRICS",
                        color = JarvisTextMuted,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
        }

        // Timeframe selector
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                timeframes.forEach { tf ->
                    val isSelected = selectedTimeframe == tf
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) JarvisPrimary else JarvisPanel)
                            .border(1.dp, if (isSelected) JarvisBright else JarvisPanelBorder, RoundedCornerShape(6.dp))
                            .clickable { selectedTimeframe = tf }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tf,
                            color = if (isSelected) JarvisBackground else JarvisTextSecondary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // KPI Metric Cards Grid
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AnalyticsKpiCard(
                    title = "DIRECTIVES",
                    value = "$totalDirectives",
                    subtitle = "Messages + Commands",
                    icon = Icons.AutoMirrored.Filled.Message,
                    color = BladeKnowledge,
                    modifier = Modifier.weight(1f)
                )
                AnalyticsKpiCard(
                    title = "TASKS DONE",
                    value = "$completedTasks / ${tasks.size}",
                    subtitle = if (tasks.isNotEmpty()) "${(completedTasks * 100) / tasks.size}% Execution" else "0%",
                    icon = Icons.Default.CheckCircle,
                    color = BladeAction,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AnalyticsKpiCard(
                    title = "FOCUS TIME",
                    value = "${totalFocusMins}m",
                    subtitle = "${focusSessions.size} Sessions",
                    icon = Icons.Default.HourglassTop,
                    color = JarvisWarning,
                    modifier = Modifier.weight(1f)
                )
                AnalyticsKpiCard(
                    title = "MEMORY NODES",
                    value = "${memories.size}",
                    subtitle = "SQLite Persistent",
                    icon = Icons.Default.Psychology,
                    color = BladeMemory,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // Activity Bar Chart
        item {
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
                            text = "SECTOR ACTIVITY BREAKDOWN",
                            color = JarvisBright,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Icon(
                            imageVector = Icons.Default.BarChart,
                            contentDescription = null,
                            tint = JarvisBright,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    TacticalBarChart(
                        values = listOf(
                            "Chat" to (messages.size.coerceAtLeast(1)),
                            "Tasks" to (tasks.size.coerceAtLeast(1)),
                            "Focus" to (focusSessions.size.coerceAtLeast(1)),
                            "Mem" to (memories.size.coerceAtLeast(1)),
                            "Cmds" to (commands.size.coerceAtLeast(1))
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Three Blades Balance Telemetry
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(JarvisPanelElevated)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                    .padding(14.dp)
            ) {
                Column {
                    Text(
                        text = "THREE BLADES HARMONY INDEX",
                        color = JarvisBright,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "• Blade 01 (Knowledge): Intelligence throughput at 98.4% nominal rate.\n• Blade 02 (Action): Active task execution velocity optimal.\n• Blade 03 (Memory): Zero latency on SQLite recall indexing.",
                        color = JarvisTextSecondary,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun AnalyticsKpiCard(
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(JarvisPanel)
            .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
            .padding(12.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    color = JarvisTextMuted,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(16.dp)
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = value,
                color = JarvisTextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )

            Text(
                text = subtitle,
                color = color,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

@Composable
private fun TacticalBarChart(
    values: List<Pair<String, Int>>,
    modifier: Modifier = Modifier
) {
    val maxVal = values.maxOfOrNull { it.second } ?: 1

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.SpaceAround,
        verticalAlignment = Alignment.Bottom
    ) {
        values.forEach { (label, count) ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Bottom,
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = "$count",
                    color = JarvisBright,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(4.dp))
                val heightPercent = (count.toFloat() / maxVal.coerceAtLeast(1)).coerceIn(0.15f, 1f)
                Box(
                    modifier = Modifier
                        .width(22.dp)
                        .height((100 * heightPercent).dp)
                        .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                        .background(JarvisPrimary)
                        .border(1.dp, JarvisBright, RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = label,
                    color = JarvisTextSecondary,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
