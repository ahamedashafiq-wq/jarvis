package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import com.example.ui.theme.BladeAction
import com.example.ui.theme.BladeKnowledge
import com.example.ui.theme.BladeMemory
import com.example.ui.theme.JarvisBright
import com.example.ui.theme.JarvisPanel
import com.example.ui.theme.JarvisPanelBorder
import com.example.ui.theme.JarvisTextMuted
import com.example.ui.theme.JarvisTextPrimary
import com.example.ui.theme.JarvisTextSecondary

@Composable
fun ThreeBladeSystem(
    activeTasksCount: Int,
    totalMemoriesCount: Int,
    isLiveAi: Boolean,
    onBladeClick: ((Int) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .testTag("three_blade_system")
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "TRIPLE BLADE ARCHITECTURE",
                color = JarvisBright,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.2.sp
            )
            Text(
                text = "STATUS: SYNCHRONIZED",
                color = JarvisTextMuted,
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Blade 01: Knowledge
            BladeCard(
                bladeNumber = "BLADE 01",
                title = "KNOWLEDGE",
                subtitle = if (isLiveAi) "GEMINI 3.5 FLASH" else "DEMO SYNAPSE",
                metric = if (isLiveAi) "ONLINE" else "LOCAL",
                color = BladeKnowledge,
                icon = Icons.Default.AutoAwesome,
                progress = if (isLiveAi) 1.0f else 0.85f,
                modifier = Modifier
                    .weight(1f)
                    .testTag("blade_knowledge_card"),
                onClick = { onBladeClick?.invoke(1) }
            )

            // Blade 02: Action
            BladeCard(
                bladeNumber = "BLADE 02",
                title = "ACTION",
                subtitle = "$activeTasksCount ACTIVE OPS",
                metric = "$activeTasksCount TASKS",
                color = BladeAction,
                icon = Icons.Default.Bolt,
                progress = (activeTasksCount / 10f).coerceIn(0.2f, 1f),
                modifier = Modifier
                    .weight(1f)
                    .testTag("blade_action_card"),
                onClick = { onBladeClick?.invoke(2) }
            )

            // Blade 03: Memory
            BladeCard(
                bladeNumber = "BLADE 03",
                title = "MEMORY",
                subtitle = "$totalMemoriesCount STORED",
                metric = "$totalMemoriesCount NODES",
                color = BladeMemory,
                icon = Icons.Default.Psychology,
                progress = (totalMemoriesCount / 20f).coerceIn(0.2f, 1f),
                modifier = Modifier
                    .weight(1f)
                    .testTag("blade_memory_card"),
                onClick = { onBladeClick?.invoke(3) }
            )
        }
    }
}

@Composable
private fun BladeCard(
    bladeNumber: String,
    title: String,
    subtitle: String,
    metric: String,
    color: Color,
    icon: ImageVector,
    progress: Float,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(JarvisPanel)
            .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(10.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = bladeNumber,
                    color = color,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = color,
                    modifier = Modifier.size(14.dp)
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = title,
                color = JarvisTextPrimary,
                fontSize = 12.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 0.5.sp
            )

            Text(
                text = subtitle,
                color = JarvisTextSecondary,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace,
                maxLines = 1
            )

            Spacer(modifier = Modifier.height(6.dp))

            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .clip(RoundedCornerShape(2.dp)),
                color = color,
                trackColor = color.copy(alpha = 0.2f)
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = metric,
                color = color,
                fontSize = 8.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}
