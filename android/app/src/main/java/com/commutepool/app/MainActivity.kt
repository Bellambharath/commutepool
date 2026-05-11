package com.commutepool.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.commutepool.app.ui.navigation.CommutePoolNavHost
import com.commutepool.app.ui.theme.CommutePoolTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CommutePoolTheme {
                CommutePoolNavHost()
            }
        }
    }
}
