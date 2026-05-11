package com.commutepool.android

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class CommutePoolApp : Application() {

    override fun onCreate() {
        super.onCreate()
        // Initialization hooks:
        // - Crash reporting
        // - Analytics
        // - Notification channels
        // - WorkManager initialization
    }
}
