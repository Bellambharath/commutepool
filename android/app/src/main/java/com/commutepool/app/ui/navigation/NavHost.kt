package com.commutepool.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.commutepool.app.ui.screens.auth.LoginScreen
import com.commutepool.app.ui.screens.auth.OtpVerifyScreen
import com.commutepool.app.ui.screens.commute.CommuteSetupScreen
import com.commutepool.app.ui.screens.notifications.NotificationsScreen
import com.commutepool.app.ui.screens.offers.CreateOfferScreen
import com.commutepool.app.ui.screens.offers.OfferDetailScreen
import com.commutepool.app.ui.screens.offers.OffersScreen
import com.commutepool.app.ui.screens.requests.RequestsScreen
import com.commutepool.app.ui.screens.safety.SosScreen
import com.commutepool.app.ui.screens.safety.ReportIncidentScreen
import com.commutepool.app.ui.screens.support.SupportScreen
import com.commutepool.app.ui.screens.support.TicketDetailScreen
import com.commutepool.app.ui.screens.trips.TripDetailScreen
import com.commutepool.app.ui.screens.trips.TripsScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommutePoolNavHost() {
    val navController = rememberNavController()

    val bottomNavItems = listOf(
        Triple(Routes.OFFERS, Icons.Filled.DirectionsBike, "Offers"),
        Triple(Routes.TRIPS, Icons.Filled.Route, "Trips"),
        Triple(Routes.NOTIFICATIONS, Icons.Filled.Notifications, "Alerts"),
        Triple(Routes.SUPPORT, Icons.Filled.Support, "Support"),
        Triple(Routes.PROFILE, Icons.Filled.Person, "Profile"),
    )

    val currentRoute by navController.currentBackStackEntryFlow
        .collectAsState(initial = null)

    val showBottomBar = currentRoute?.destination?.route in bottomNavItems.map { it.first }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { (route, icon, label) ->
                        NavigationBarItem(
                            selected = currentRoute?.destination?.route == route,
                            onClick = { navController.navigate(route) { launchSingleTop = true } },
                            icon = { Icon(icon, contentDescription = label) },
                            label = { Text(label) }
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.LOGIN,
            modifier = Modifier.padding(padding)
        ) {
            composable(Routes.LOGIN) { LoginScreen(navController) }
            composable(Routes.OTP_VERIFY) { OtpVerifyScreen(navController) }
            composable(Routes.COMMUTE_SETUP) { CommuteSetupScreen(navController) }
            composable(Routes.OFFERS) { OffersScreen(navController) }
            composable(Routes.OFFER_DETAIL) { OfferDetailScreen(navController) }
            composable(Routes.CREATE_OFFER) { CreateOfferScreen(navController) }
            composable(Routes.REQUESTS) { RequestsScreen(navController) }
            composable(Routes.TRIPS) { TripsScreen(navController) }
            composable(Routes.TRIP_DETAIL) { TripDetailScreen(navController) }
            composable(Routes.NOTIFICATIONS) { NotificationsScreen(navController) }
            composable(Routes.SUPPORT) { SupportScreen(navController) }
            composable(Routes.SUPPORT_TICKET_DETAIL) { TicketDetailScreen(navController) }
            composable(Routes.SAFETY_SOS) { SosScreen(navController) }
            composable(Routes.SAFETY_REPORT) { ReportIncidentScreen(navController) }
        }
    }
}
