package com.commutepool.android.core.designsystem.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Brand palette — will be finalized with Figma token export
private val cpPrimary = Color(0xFF1A56DB)      // Trust blue
private val cpOnPrimary = Color(0xFFFFFFFF)
private val cpSecondary = Color(0xFF0E9F6E)    // Success green
private val cpSurface = Color(0xFFF9FAFB)
private val cpBackground = Color(0xFFFFFFFF)
private val cpError = Color(0xFFE02424)        // Danger red
private val cpWarning = Color(0xFFFF5A1F)      // Warning orange (custom semantic)

private val CommutePoolColorScheme = lightColorScheme(
    primary = cpPrimary,
    onPrimary = cpOnPrimary,
    secondary = cpSecondary,
    surface = cpSurface,
    background = cpBackground,
    error = cpError
)

@Composable
fun CommutePoolTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = CommutePoolColorScheme,
        typography = CommutePoolTypography,
        content = content
    )
}
