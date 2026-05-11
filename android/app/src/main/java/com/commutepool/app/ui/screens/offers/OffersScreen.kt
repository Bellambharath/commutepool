package com.commutepool.app.ui.screens.offers

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
import com.commutepool.app.data.remote.dto.OfferDto
import com.commutepool.app.ui.navigation.Routes

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OffersScreen(
    navController: NavController,
    vm: OffersViewModel = hiltViewModel()
) {
    val offers by vm.offers.collectAsState()
    val loading by vm.loading.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("My Offers") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { navController.navigate(Routes.CREATE_OFFER) }) {
                Icon(Icons.Filled.Add, "Create Offer")
            }
        }
    ) { padding ->
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (offers.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No offers yet. Create your first offer!",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(contentPadding = padding) {
                items(offers) { offer ->
                    OfferCard(offer) { navController.navigate(Routes.offerDetail(offer.id)) }
                }
            }
        }
    }
}

@Composable
fun OfferCard(offer: OfferDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onClick() }
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(offer.direction, style = MaterialTheme.typography.titleMedium)
                Text(offer.status, style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary)
            }
            Text("Date: ${offer.offerDate}  |  ${offer.departureTime}",
                style = MaterialTheme.typography.bodyMedium)
            Text("Seats: ${offer.acceptedSeats}/${offer.availableSeats} filled",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
