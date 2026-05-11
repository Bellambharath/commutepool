package com.commutepool.app.ui.screens.support

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.MessageDto
import com.commutepool.app.data.remote.dto.TicketDetailDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TicketDetailViewModel @Inject constructor(
    private val api: ApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    private val ticketId = savedStateHandle.get<String>("ticketId") ?: ""

    private val _ticket = MutableStateFlow<TicketDetailDto?>(null)
    val ticket = _ticket.asStateFlow()
    private val _loading = MutableStateFlow(true)
    val loading = _loading.asStateFlow()

    init { load() }

    private fun load() {
        viewModelScope.launch {
            try { _ticket.value = api.getTicketDetail(ticketId) }
            finally { _loading.value = false }
        }
    }

    fun sendMessage(message: String) {
        viewModelScope.launch {
            runCatching { api.addTicketMessage(ticketId, MessageDto(message)) }
            load()
        }
    }
}
