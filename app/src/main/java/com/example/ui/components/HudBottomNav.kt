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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.JarvisBackground
import com.example.ui.theme.JarvisBright
import com.example.ui.theme.JarvisPanel
import com.example.ui.theme.JarvisPanelBorder
import com.example.ui.theme.JarvisPanelBorderBright
import com.example.ui.theme.JarvisPrimary
import com.example.ui.theme.JarvisTextMuted
import com.example.ui.theme.JarvisTextSecondary

enum class JarvisScreen(val title: String, val icon: ImageVector) {
    DASHBOARD("HOME", Icons.Default.Dashboard),
    CHAT("CHAT", Icons.Default.ChatBubble),
    VOICE("VOICE", Icons.Default.Mic),
    TASKS("TASKS", Icons.Default.CheckCircle),
    COMMANDS("TERMINAL", Icons.Default.Terminal),
    MORE("MORE", Icons.Default.MoreHoriz)
}

@Composable
fun HudBottomNav(
    currentScreen: JarvisScreen,
    onScreenSelected: (JarvisScreen) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(JarvisBackground)
            .border(width = 1.dp, color = JarvisPanelBorder)
            .navigationBarsPadding()
            .padding(vertical = 4.dp, horizontal = 8.dp)
            .testTag("hud_bottom_nav")
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            JarvisScreen.values().forEach { screen ->
                val isSelected = currentScreen == screen
                val isVoice = screen == JarvisScreen.VOICE

                if (isVoice) {
                    // Elevated center voice button
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(if (isSelected) JarvisBright else JarvisPrimary)
                            .border(2.dp, if (isSelected) JarvisBright else JarvisPanelBorderBright, CircleShape)
                            .clickable { onScreenSelected(screen) }
                            .testTag("nav_${screen.name.lowercase()}"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = screen.icon,
                            contentDescription = screen.title,
                            tint = JarvisBackground,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onScreenSelected(screen) }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                            .testTag("nav_${screen.name.lowercase()}"),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = screen.icon,
                            contentDescription = screen.title,
                            tint = if (isSelected) JarvisBright else JarvisTextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = screen.title,
                            color = if (isSelected) JarvisBright else JarvisTextMuted,
                            fontSize = 9.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontFamily = FontFamily.Monospace
                        )
                        if (isSelected) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 2.dp)
                                    .size(width = 14.dp, height = 2.dp)
                                    .clip(RoundedCornerShape(1.dp))
                                    .background(JarvisBright)
                            )
                        }
                    }
                }
            }
        }
    }
}
