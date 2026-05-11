package com.commutepool.app.ui.screens.commute

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
fun CommuteSetupScreen(
    navController: NavController,
    vm: CommuteSetupViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    val scroll = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Commute Setup") },
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
            Text("Home Location", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(value = state.homeArea, onValueChange = vm::onHomeAreaChanged,
                label = { Text("Home area / landmark") }, modifier = Modifier.fillMaxWidth(), singleLine = true)

            Spacer(Modifier.height(12.dp))
            Text("Office Location", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(value = state.officeArea, onValueChange = vm::onOfficeAreaChanged,
                label = { Text("Office area / landmark") }, modifier = Modifier.fillMaxWidth(), singleLine = true)

            Spacer(Modifier.height(12.dp))
            Text("Morning Departure", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(value = state.morningTime, onValueChange = vm::onMorningTimeChanged,
                label = { Text("HH:mm") }, modifier = Modifier.fillMaxWidth(), singleLine = true)

            Spacer(Modifier.height(12.dp))
            Text("Evening Departure", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(value = state.eveningTime, onValueChange = vm::onEveningTimeChanged,
                label = { Text("HH:mm") }, modifier = Modifier.fillMaxWidth(), singleLine = true)

            Spacer(Modifier.height(12.dp))
            Text("Active Days", style = MaterialTheme.typography.titleSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("Mon", "Tue", "Wed", "Thu", "Fri").forEach { day ->
                    FilterChip(
                        selected = day in state.activeDays,
                        onClick = { vm.toggleDay(day) },
                        label = { Text(day) }
                    )
                }
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = { vm.save { navController.popBackStack() } },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = !state.loading
            ) {
                if (state.loading) CircularProgressIndicator(modifier = Modifier.size(20.dp))
                else Text("Save Commute Profile")
            }

            state.error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
