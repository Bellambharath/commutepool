package com.commutepool.app.ui.screens.offers

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
fun OfferDetailScreen(
    navController: NavController,
    vm: OfferDetailViewModel = hiltViewModel()
) {
    val offer by vm.offer.collectAsState()
    val requests by vm.requests.collectAsState()
    val loading by vm.loading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Offer Detail") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Filled.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(Modifier.padding(padding).padding(16.dp)) {
            offer?.let { o ->
                item {
                    Text("${o.direction}  •  ${o.offerDate}", style = MaterialTheme.typography.titleMedium)
                    Text("Departure: ${o.departureTime}")
                    Text("Seats: ${o.acceptedSeats}/${o.availableSeats}")
                    Text("Status: ${o.status}", color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(16.dp))
                    Text("Ride Requests", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(8.dp))
                }
                items(requests) { req ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Row(
                            Modifier.padding(12.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(req.riderName, style = MaterialTheme.typography.bodyMedium)
                                Text(req.status, style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.secondary)
                            }
                            if (req.status == "Pending") {
                                Row {
                                    TextButton(onClick = { vm.accept(req.id) }) { Text("Accept") }
                                    TextButton(onClick = { vm.decline(req.id) }) { Text("Decline") }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
