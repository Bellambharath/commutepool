package com.commutepool.app.ui.screens.safety

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
fun ReportIncidentScreen(
    navController: NavController,
    vm: ReportIncidentViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()

    val incidentTypes = listOf("Harassment", "Accident", "RecklessDriving", "VehicleMismatch", "Other")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Report Incident") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Filled.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(Modifier.padding(padding).padding(16.dp)) {
            Text("Incident Type", style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(8.dp))

            incidentTypes.forEach { type ->
                FilterChip(
                    selected = state.incidentType == type,
                    onClick = { vm.onTypeSelected(type) },
                    label = { Text(type) },
                    modifier = Modifier.padding(end = 8.dp)
                )
            }

            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = state.description,
                onValueChange = vm::onDescriptionChanged,
                label = { Text("Describe what happened") },
                modifier = Modifier.fillMaxWidth().height(140.dp),
                maxLines = 5
            )

            Spacer(Modifier.height(16.dp))

            Button(
                onClick = { vm.submit { navController.popBackStack() } },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = state.description.isNotBlank() && state.incidentType != null && !state.loading
            ) {
                if (state.loading) CircularProgressIndicator(modifier = Modifier.size(20.dp))
                else Text("Submit Report")
            }

            state.error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
