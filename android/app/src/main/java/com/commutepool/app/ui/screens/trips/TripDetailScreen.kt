package com.commutepool.app.ui.screens.trips

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TripDetailScreen(
    navController: NavController,
    vm: TripDetailViewModel = hiltViewModel()
) {
    val trip by vm.trip.collectAsState()
    val loading by vm.loading.collectAsState()
    val actionState by vm.actionState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Trip Detail") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Filled.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                CircularProgressIndicator()
            }
        } else trip?.let { t ->
            Column(Modifier.padding(padding).padding(16.dp)) {
                Text("Owner: ${t.ownerName}", style = MaterialTheme.typography.titleMedium)
                Text("Rider: ${t.riderName}", style = MaterialTheme.typography.bodyMedium)
                Text("Status: ${t.status}", style = MaterialTheme.typography.bodyMedium)
                t.startedAt?.let { Text("Started: ${it.take(16)}") }
                t.completedAt?.let { Text("Completed: ${it.take(16)}") }
                t.cancelledAt?.let { Text("Cancelled: ${it.take(16)}") }
                t.cancelReason?.let { Text("Reason: $it", color = MaterialTheme.colorScheme.error) }

                Spacer(Modifier.height(24.dp))

                if (t.status == "InProgress") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = vm::complete, modifier = Modifier.weight(1f)) { Text("Complete") }
                        OutlinedButton(onClick = vm::cancel, modifier = Modifier.weight(1f)) { Text("Cancel") }
                    }
                }

                actionState.error?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}
