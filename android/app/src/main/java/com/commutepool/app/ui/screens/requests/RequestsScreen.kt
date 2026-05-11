package com.commutepool.app.ui.screens.requests

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestsScreen(
    navController: NavController,
    vm: RequestsViewModel = hiltViewModel()
) {
    val requests by vm.requests.collectAsState()
    val loading by vm.loading.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("My Requests") }) }
    ) { padding ->
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(contentPadding = padding) {
                items(requests) { req ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        Row(
                            Modifier.padding(16.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(req.riderName, style = MaterialTheme.typography.titleSmall)
                                Text(req.status, style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.secondary)
                            }
                            if (req.status == "Pending") {
                                TextButton(onClick = { vm.withdraw(req.id) }) { Text("Withdraw") }
                            }
                        }
                    }
                }
            }
        }
    }
}
