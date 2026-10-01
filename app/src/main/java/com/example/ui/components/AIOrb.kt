package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.ui.theme.JarvisBright
import com.example.ui.theme.JarvisDanger
import com.example.ui.theme.JarvisPrimary
import com.example.ui.theme.JarvisSecondary
import com.example.ui.voice.VoiceState
import kotlin.math.cos
import kotlin.math.sin

enum class AIOrbState {
    IDLE,
    LISTENING,
    THINKING,
    SPEAKING,
    EXECUTING,
    SUCCESS,
    ERROR
}

@Composable
fun AIOrb(
    state: AIOrbState = AIOrbState.IDLE,
    size: Dp = 160.dp,
    audioLevel: Float = 0f,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    val infiniteTransition = rememberInfiniteTransition(label = "AIOrbAnimation")

    // Slow breathing for idle
    val breatheScale by infiniteTransition.animateFloat(
        initialValue = 0.88f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breathe"
    )

    // Continuous rotation for thinking/tactical scan
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                when (state) {
                    AIOrbState.THINKING -> 2000
                    AIOrbState.EXECUTING -> 1000
                    else -> 8000
                },
                easing = LinearEasing
            )
        ),
        label = "rotation"
    )

    // Reverse counter-rotation for inner core
    val counterRotation by infiniteTransition.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                when (state) {
                    AIOrbState.THINKING -> 3000
                    AIOrbState.EXECUTING -> 1500
                    else -> 12000
                },
                easing = LinearEasing
            )
        ),
        label = "counterRotation"
    )

    // Pulse for waves
    val wavePulse by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "wavePulse"
    )

    val primaryColor = when (state) {
        AIOrbState.ERROR -> JarvisDanger
        AIOrbState.EXECUTING -> JarvisBright
        AIOrbState.SUCCESS -> JarvisBright
        else -> JarvisPrimary
    }

    val glowColor = when (state) {
        AIOrbState.ERROR -> JarvisDanger.copy(alpha = 0.5f)
        AIOrbState.EXECUTING -> JarvisBright.copy(alpha = 0.6f)
        AIOrbState.SPEAKING -> JarvisBright.copy(alpha = 0.5f)
        else -> JarvisSecondary.copy(alpha = 0.35f)
    }

    Box(
        modifier = modifier
            .size(size)
            .testTag("ai_orb_component")
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.matchParentSize()) {
            val center = Offset(this.size.width / 2f, this.size.height / 2f)
            val radius = this.size.minDimension / 2f

            // 1. Outer tactical ring with ticks
            drawCircle(
                color = primaryColor.copy(alpha = 0.18f),
                radius = radius * 0.95f,
                center = center,
                style = Stroke(width = 1.5f)
            )

            // 2. State-dependent expanding wave / rings
            if (state == AIOrbState.LISTENING || state == AIOrbState.SPEAKING) {
                val expandedRadius = radius * (0.6f + (if (state == AIOrbState.SPEAKING) audioLevel.coerceIn(0.1f, 0.4f) else wavePulse * 0.35f))
                drawCircle(
                    color = primaryColor.copy(alpha = (1f - wavePulse).coerceIn(0.1f, 0.7f)),
                    radius = expandedRadius,
                    center = center,
                    style = Stroke(width = 2.5f)
                )
            }

            // 3. Three Blade Geometric Elements (Tactical Triad)
            rotate(rotation, pivot = center) {
                for (bladeIdx in 0..2) {
                    val angleDeg = bladeIdx * 120.0
                    val angleRad = Math.toRadians(angleDeg)
                    val bladeLen = radius * 0.75f
                    val endX = center.x + (bladeLen * cos(angleRad)).toFloat()
                    val endY = center.y + (bladeLen * sin(angleRad)).toFloat()

                    // Blade trajectory stroke
                    drawLine(
                        brush = Brush.linearGradient(
                            colors = listOf(primaryColor, primaryColor.copy(alpha = 0.1f)),
                            start = center,
                            end = Offset(endX, endY)
                        ),
                        start = center,
                        end = Offset(endX, endY),
                        strokeWidth = 2.5f,
                        cap = StrokeCap.Round
                    )

                    // Blade edge tip marker
                    drawCircle(
                        color = JarvisBright,
                        radius = 3.5f,
                        center = Offset(endX, endY)
                    )
                }

                // Geometric outer segmented arc
                drawArc(
                    color = primaryColor,
                    startAngle = 0f,
                    sweepAngle = 60f,
                    useCenter = false,
                    topLeft = Offset(center.x - radius * 0.85f, center.y - radius * 0.85f),
                    size = androidx.compose.ui.geometry.Size(radius * 1.7f, radius * 1.7f),
                    style = Stroke(width = 2f)
                )
                drawArc(
                    color = primaryColor,
                    startAngle = 120f,
                    sweepAngle = 60f,
                    useCenter = false,
                    topLeft = Offset(center.x - radius * 0.85f, center.y - radius * 0.85f),
                    size = androidx.compose.ui.geometry.Size(radius * 1.7f, radius * 1.7f),
                    style = Stroke(width = 2f)
                )
                drawArc(
                    color = primaryColor,
                    startAngle = 240f,
                    sweepAngle = 60f,
                    useCenter = false,
                    topLeft = Offset(center.x - radius * 0.85f, center.y - radius * 0.85f),
                    size = androidx.compose.ui.geometry.Size(radius * 1.7f, radius * 1.7f),
                    style = Stroke(width = 2f)
                )
            }

            // 4. Counter-rotating inner reticle
            rotate(counterRotation, pivot = center) {
                drawCircle(
                    color = JarvisBright.copy(alpha = 0.45f),
                    radius = radius * 0.5f,
                    center = center,
                    style = Stroke(width = 1.5f)
                )

                // 4 compass tick marks
                val tickDist = radius * 0.5f
                drawLine(
                    color = JarvisBright,
                    start = Offset(center.x - tickDist - 6, center.y),
                    end = Offset(center.x - tickDist + 6, center.y),
                    strokeWidth = 2f
                )
                drawLine(
                    color = JarvisBright,
                    start = Offset(center.x + tickDist - 6, center.y),
                    end = Offset(center.x + tickDist + 6, center.y),
                    strokeWidth = 2f
                )
            }

            // 5. Central Energy Core (Breathing Radial Gradient)
            val currentScale = when (state) {
                AIOrbState.IDLE -> breatheScale
                AIOrbState.LISTENING -> 1.0f + (audioLevel * 0.3f)
                AIOrbState.SPEAKING -> 0.95f + (audioLevel * 0.4f)
                AIOrbState.THINKING -> 1.15f
                AIOrbState.EXECUTING -> 1.25f
                AIOrbState.SUCCESS -> 1.35f
                AIOrbState.ERROR -> 1.1f
            }

            val coreRadius = radius * 0.38f * currentScale
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        JarvisBright,
                        primaryColor,
                        glowColor,
                        Color.Transparent
                    ),
                    center = center,
                    radius = coreRadius * 1.5f
                ),
                radius = coreRadius,
                center = center
            )

            // Inner high-intensity energy center dot
            drawCircle(
                color = Color.White.copy(alpha = 0.9f),
                radius = coreRadius * 0.28f,
                center = center
            )
        }
    }
}
