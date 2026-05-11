package com.commutepool.app.ui.screens.trips

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.commutepool.app.data.remote.dto.TripDto
import com.commutepool.app.ui.navigation.Routes

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TripsScreen(
    navController: NavController,
    vm: TripsViewModel = hiltViewModel()
) {
    val trips by vm.trips.collectAsState()
    val loading by vm.loading.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("My Trips") }) }
    ) { padding ->
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(contentPadding = padding) {
                items(trips) { trip ->
                    TripCard(trip) { navController.navigate(Routes.tripDetail(trip.id)) }
                }
            }
        }
    }
}

@Composable
fun TripCard(trip: TripDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onClick() }
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(trip.ownerName, style = MaterialTheme.typography.titleMedium)
                TripStatusChip(trip.status)
            }
            Spacer(Modifier.height(4.dp))
            Text("Rider: ${trip.riderName}", style = MaterialTheme.typography.bodyMedium)
            Text("Date: ${trip.createdAt.take(10)}", style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun TripStatusChip(status: String) {
    val (color, label) = when (status) {
        "Completed" -> MaterialTheme.colorScheme.primary to "Completed"
        "InProgress" -> MaterialTheme.colorScheme.secondary to "In Progress"
        "Cancelled" -> MaterialTheme.colorScheme.error to "Cancelled"
        else -> MaterialTheme.colorScheme.outline to status
    }
    Surface(color = color.copy(alpha = 0.15f), shape = MaterialTheme.shapes.small) {
        Text(label, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            color = color, style = MaterialTheme.typography.labelSmall)
    }
}
