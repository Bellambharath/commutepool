package com.commutepool.app.ui.screens.requests

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.RideRequestDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RequestsViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _requests = MutableStateFlow<List<RideRequestDto>>(emptyList())
    val requests = _requests.asStateFlow()
    private val _loading = MutableStateFlow(true)
    val loading = _loading.asStateFlow()

    init { load() }

    private fun load() {
        viewModelScope.launch {
            try { _requests.value = api.getMyRequests() }
            finally { _loading.value = false }
        }
    }

    fun withdraw(requestId: String) {
        viewModelScope.launch { runCatching { api.withdrawRequest(requestId) }; load() }
    }
}
