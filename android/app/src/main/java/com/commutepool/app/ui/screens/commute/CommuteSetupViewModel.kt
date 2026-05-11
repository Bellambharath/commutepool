package com.commutepool.app.ui.screens.commute

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.UpsertCommuteProfileDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CommuteSetupState(
    val homeArea: String = "",
    val officeArea: String = "",
    val morningTime: String = "08:30",
    val eveningTime: String = "18:30",
    val activeDays: Set<String> = setOf("Mon", "Tue", "Wed", "Thu", "Fri"),
    val corridorId: String = "", // TODO: fetch/select from corridors
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class CommuteSetupViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(CommuteSetupState())
    val state = _state.asStateFlow()

    fun onHomeAreaChanged(v: String) { _state.value = _state.value.copy(homeArea = v) }
    fun onOfficeAreaChanged(v: String) { _state.value = _state.value.copy(officeArea = v) }
    fun onMorningTimeChanged(v: String) { _state.value = _state.value.copy(morningTime = v) }
    fun onEveningTimeChanged(v: String) { _state.value = _state.value.copy(eveningTime = v) }

    fun toggleDay(day: String) {
        val days = _state.value.activeDays.toMutableSet()
        if (day in days) days.remove(day) else days.add(day)
        _state.value = _state.value.copy(activeDays = days)
    }

    fun save(onSuccess: () -> Unit) {
        val s = _state.value
        viewModelScope.launch {
            _state.value = s.copy(loading = true, error = null)
            try {
                api.upsertCommuteProfile(UpsertCommuteProfileDto(
                    corridorId = s.corridorId,
                    homeArea = s.homeArea,
                    homeLat = 0.0, homeLng = 0.0, // TODO: geocode
                    officeArea = s.officeArea,
                    officeLat = 0.0, officeLng = 0.0,
                    morningDepartureTime = s.morningTime,
                    eveningDepartureTime = s.eveningTime,
                    activeDays = s.activeDays.toList()
                ))
                onSuccess()
            } catch (e: Exception) {
                _state.value = _state.value.copy(loading = false, error = e.message)
            }
        }
    }
}
