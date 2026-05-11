package com.commutepool.app.ui.screens.support

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.commutepool.app.ui.navigation.Routes

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SupportScreen(
    navController: NavController,
    vm: SupportViewModel = hiltViewModel()
) {
    val tickets by vm.tickets.collectAsState()
    val loading by vm.loading.collectAsState()
    var showRaiseDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Support") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { showRaiseDialog = true }) {
                Icon(Icons.Filled.Add, "New Ticket")
            }
        }
    ) { padding ->
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else {
            LazyColumn(contentPadding = padding) {
                items(tickets) { ticket ->
                    ListItem(
                        modifier = Modifier.clickable { navController.navigate(Routes.ticketDetail(ticket.id)) },
                        headlineContent = { Text(ticket.subject) },
                        supportingContent = { Text(ticket.category) },
                        trailingContent = { Text(ticket.status, style = MaterialTheme.typography.labelSmall) }
                    )
                    HorizontalDivider()
                }
            }
        }
    }

    if (showRaiseDialog) {
        RaiseTicketDialog(
            onDismiss = { showRaiseDialog = false },
            onSubmit = { category, subject, body ->
                vm.raise(category, subject, body)
                showRaiseDialog = false
            }
        )
    }
}

@Composable
fun RaiseTicketDialog(onDismiss: () -> Unit, onSubmit: (String, String, String) -> Unit) {
    var category by remember { mutableStateOf("General") }
    var subject by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("New Support Ticket") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = subject, onValueChange = { subject = it },
                    label = { Text("Subject") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = body, onValueChange = { body = it },
                    label = { Text("Describe your issue") }, modifier = Modifier.fillMaxWidth().height(100.dp))
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(category, subject, body) }, enabled = subject.isNotBlank() && body.isNotBlank()) {
                Text("Submit")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
