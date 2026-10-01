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
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import com.example.ui.SubScreen
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MoreMenuSheet(
    onDismiss: () -> Unit,
    onNavigate: (SubScreen) -> Unit
) {
    val sheetState = rememberModalBottomSheetState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = JarvisPanelElevated,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 10.dp)
                    .size(width = 36.dp, height = 4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(JarvisPanelBorder)
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp)
                .testTag("more_menu_sheet")
        ) {
            Text(
                text = "SUBSYSTEM ROUTING",
                color = JarvisBright,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.2.sp
            )
            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MoreMenuTile(
                    title = "MEMORY BANK",
                    subtitle = "Blade 03 persistent nodes",
                    icon = Icons.Default.Psychology,
                    color = BladeMemory,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        onDismiss()
                        onNavigate(SubScreen.MEMORY)
                    }
                )
                MoreMenuTile(
                    title = "FOCUS PROTOCOL",
                    subtitle = "Combat discipline timer",
                    icon = Icons.Default.HourglassTop,
                    color = JarvisWarning,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        onDismiss()
                        onNavigate(SubScreen.FOCUS)
                    }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MoreMenuTile(
                    title = "ANALYTICS",
                    subtitle = "Productivity telemetry",
                    icon = Icons.Default.BarChart,
                    color = BladeAction,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        onDismiss()
                        onNavigate(SubScreen.ANALYTICS)
                    }
                )
                MoreMenuTile(
                    title = "SYSTEM LOGS",
                    subtitle = "Realtime event stream",
                    icon = Icons.Default.Notifications,
                    color = JarvisBright,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        onDismiss()
                        onNavigate(SubScreen.LOGS)
                    }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MoreMenuTile(
                    title = "SETTINGS",
                    subtitle = "Core parameters & voice",
                    icon = Icons.Default.Tune,
                    color = JarvisTextPrimary,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        onDismiss()
                        onNavigate(SubScreen.SETTINGS)
                    }
                )
                MoreMenuTile(
                    title = "OPERATOR PROFILE",
                    subtitle = "Dossier & auth credentials",
                    icon = Icons.Default.Person,
                    color = JarvisBright,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        onDismiss()
                        onNavigate(SubScreen.PROFILE)
                    }
                )
            }

            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}

@Composable
private fun MoreMenuTile(
    title: String,
    subtitle: String,
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
            .padding(12.dp)
            .testTag("menu_${title.lowercase().replace(" ", "_")}")
    ) {
        Column {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = color,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = title,
                color = JarvisTextPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtitle,
                color = JarvisTextMuted,
                fontSize = 9.sp,
                maxLines = 1
            )
        }
    }
}
