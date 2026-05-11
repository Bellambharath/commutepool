package com.commutepool.app.ui.screens.safety

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.SosDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SosState(val loading: Boolean = false, val sent: Boolean = false, val error: String? = null)

@HiltViewModel
class SosViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(SosState())
    val state = _state.asStateFlow()

    fun raiseSos() {
        viewModelScope.launch {
            _state.value = SosState(loading = true)
            try {
                // TODO: get real GPS coords from LocationManager
                api.raiseSos(SosDto(tripId = null, lat = 17.385, lng = 78.4867, note = null))
                _state.value = SosState(sent = true)
            } catch (e: Exception) {
                _state.value = SosState(error = e.message)
            }
        }
    }
}
