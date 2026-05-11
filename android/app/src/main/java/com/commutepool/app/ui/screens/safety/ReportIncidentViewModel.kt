package com.commutepool.app.ui.screens.safety

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.ReportIncidentDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReportState(
    val incidentType: String? = null,
    val description: String = "",
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ReportIncidentViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(ReportState())
    val state = _state.asStateFlow()

    fun onTypeSelected(type: String) { _state.value = _state.value.copy(incidentType = type) }
    fun onDescriptionChanged(value: String) { _state.value = _state.value.copy(description = value) }

    fun submit(onSuccess: () -> Unit) {
        val s = _state.value
        if (s.incidentType == null) return
        viewModelScope.launch {
            _state.value = s.copy(loading = true, error = null)
            try {
                api.reportIncident(ReportIncidentDto(null, s.incidentType, s.description))
                onSuccess()
            } catch (e: Exception) {
                _state.value = _state.value.copy(loading = false, error = e.message)
            }
        }
    }
}
