package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val JarvisColorScheme = darkColorScheme(
    primary = JarvisPrimary,
    onPrimary = JarvisBackground,
    primaryContainer = JarvisSecondary,
    onPrimaryContainer = JarvisBright,
    secondary = JarvisSecondary,
    onSecondary = JarvisTextPrimary,
    secondaryContainer = JarvisPanelElevated,
    onSecondaryContainer = JarvisBright,
    tertiary = JarvisBright,
    onTertiary = JarvisBackground,
    background = JarvisBackground,
    onBackground = JarvisTextPrimary,
    surface = JarvisPanel,
    onSurface = JarvisTextPrimary,
    surfaceVariant = JarvisPanelElevated,
    onSurfaceVariant = JarvisTextSecondary,
    outline = JarvisPanelBorder,
    outlineVariant = JarvisPanelBorderBright,
    error = JarvisDanger,
    onError = JarvisTextPrimary
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = JarvisColorScheme,
        typography = Typography,
        content = content
    )
}
