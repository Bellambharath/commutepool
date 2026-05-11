package com.commutepool.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BrandGreen = Color(0xFF1B8A5A)
val BrandGreenVariant = Color(0xFF0E5C3A)
val BrandOrange = Color(0xFFF76C1B)
val SurfaceLight = Color(0xFFF6F9F7)
val SurfaceDark = Color(0xFF121C17)

private val LightColors = lightColorScheme(
    primary = BrandGreen,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFB7F0D4),
    secondary = BrandOrange,
    background = SurfaceLight,
    surface = Color.White,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF5DDBA4),
    onPrimary = Color(0xFF00382A),
    secondary = BrandOrange,
    background = SurfaceDark,
    surface = Color(0xFF1E2D26),
)

@Composable
fun CommutePoolTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content
    )
}
