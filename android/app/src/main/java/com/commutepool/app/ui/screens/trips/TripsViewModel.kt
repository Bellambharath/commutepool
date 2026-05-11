package com.commutepool.app.ui.screens.trips

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.TripDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TripsViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _trips = MutableStateFlow<List<TripDto>>(emptyList())
    val trips = _trips.asStateFlow()
    private val _loading = MutableStateFlow(true)
    val loading = _loading.asStateFlow()

    init { loadTrips() }

    private fun loadTrips() {
        viewModelScope.launch {
            try { _trips.value = api.getMyTrips() }
            finally { _loading.value = false }
        }
    }
}
