package com.commutepool.app.ui.screens.offers

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
fun CreateOfferScreen(
    navController: NavController,
    vm: CreateOfferViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Offer") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Filled.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(scroll)
        ) {
            Text("Direction", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("ToOffice", "ToHome").forEach { dir ->
                    FilterChip(
                        selected = state.direction == dir,
                        onClick = { vm.onDirectionChanged(dir) },
                        label = { Text(dir) }
                    )
                }
            }
            Spacer(Modifier.height(12.dp))

            OutlinedTextField(value = state.offerDate, onValueChange = vm::onDateChanged,
                label = { Text("Offer Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = state.departureTime, onValueChange = vm::onDepartureChanged,
                label = { Text("Departure Time (HH:mm)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(value = state.availableSeats, onValueChange = vm::onSeatsChanged,
                label = { Text("Available Seats") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            Spacer(Modifier.height(24.dp))

            Button(
                onClick = { vm.create { navController.popBackStack() } },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = !state.loading
            ) {
                if (state.loading) CircularProgressIndicator(modifier = Modifier.size(20.dp))
                else Text("Post Offer")
            }

            state.error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
