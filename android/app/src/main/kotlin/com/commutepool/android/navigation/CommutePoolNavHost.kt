package com.commutepool.android.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController

// Routes will be registered here as feature modules are implemented.
// Auth is the entry point; dashboard is post-auth root.
const val ROUTE_AUTH = "auth"
const val ROUTE_DASHBOARD = "dashboard"
const val ROUTE_ONBOARDING = "onboarding"
const val ROUTE_COMMUTE = "commute"
const val ROUTE_OFFERS = "offers"
const val ROUTE_REQUESTS = "requests"
const val ROUTE_MATCHES = "matches"
const val ROUTE_TRIP = "trip"
const val ROUTE_PROFILE = "profile"
const val ROUTE_SAFETY = "safety"
const val ROUTE_SUPPORT = "support"
const val ROUTE_NOTIFICATIONS = "notifications"

@Composable
fun CommutePoolNavHost() {
    val navController = rememberNavController()
    NavHost(
        navController = navController,
        startDestination = ROUTE_AUTH
    ) {
        // Feature nav graphs will be registered here:
        // authNavGraph(navController)
        // onboardingNavGraph(navController)
        // homeNavGraph(navController)
        // commuteNavGraph(navController)
        // offerNavGraph(navController)
        // requestNavGraph(navController)
        // matchNavGraph(navController)
        // tripNavGraph(navController)
        // safetyNavGraph(navController)
        // supportNavGraph(navController)
        // notificationsNavGraph(navController)
        // profileNavGraph(navController)
    }
}
