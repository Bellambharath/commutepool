package com.commutepool.app.ui.screens.offers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.CreateOfferDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CreateOfferState(
    val direction: String = "ToOffice",
    val offerDate: String = "",
    val departureTime: String = "",
    val availableSeats: String = "1",
    val vehicleId: String = "", // TODO: fetch from vehicle store
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class CreateOfferViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(CreateOfferState())
    val state = _state.asStateFlow()

    fun onDirectionChanged(v: String) { _state.value = _state.value.copy(direction = v) }
    fun onDateChanged(v: String) { _state.value = _state.value.copy(offerDate = v) }
    fun onDepartureChanged(v: String) { _state.value = _state.value.copy(departureTime = v) }
    fun onSeatsChanged(v: String) { _state.value = _state.value.copy(availableSeats = v) }

    fun create(onSuccess: () -> Unit) {
        val s = _state.value
        viewModelScope.launch {
            _state.value = s.copy(loading = true, error = null)
            try {
                api.createOffer(CreateOfferDto(
                    vehicleId = s.vehicleId,
                    direction = s.direction,
                    offerDate = s.offerDate,
                    departureTime = s.departureTime,
                    availableSeats = s.availableSeats.toIntOrNull() ?: 1,
                    startLat = 0.0, startLng = 0.0, // TODO: from commute profile
                    endLat = 0.0, endLng = 0.0
                ))
                onSuccess()
            } catch (e: Exception) {
                _state.value = _state.value.copy(loading = false, error = e.message)
            }
        }
    }
}
