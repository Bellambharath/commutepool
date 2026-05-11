package com.commutepool.app.ui.screens.trips

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.CancelReasonDto
import com.commutepool.app.data.remote.dto.TripDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TripActionState(val loading: Boolean = false, val error: String? = null)

@HiltViewModel
class TripDetailViewModel @Inject constructor(
    private val api: ApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    private val tripId = savedStateHandle.get<String>("tripId") ?: ""

    private val _trip = MutableStateFlow<TripDto?>(null)
    val trip = _trip.asStateFlow()
    private val _loading = MutableStateFlow(true)
    val loading = _loading.asStateFlow()
    private val _actionState = MutableStateFlow(TripActionState())
    val actionState = _actionState.asStateFlow()

    init { load() }

    private fun load() {
        viewModelScope.launch {
            try { _trip.value = api.getTripDetail(tripId) }
            finally { _loading.value = false }
        }
    }

    fun complete() {
        viewModelScope.launch {
            _actionState.value = TripActionState(loading = true)
            try { api.completeTrip(tripId); load() }
            catch (e: Exception) { _actionState.value = TripActionState(error = e.message) }
        }
    }

    fun cancel() {
        viewModelScope.launch {
            _actionState.value = TripActionState(loading = true)
            try { api.cancelTrip(tripId, CancelReasonDto("Cancelled by user")); load() }
            catch (e: Exception) { _actionState.value = TripActionState(error = e.message) }
        }
    }
}
