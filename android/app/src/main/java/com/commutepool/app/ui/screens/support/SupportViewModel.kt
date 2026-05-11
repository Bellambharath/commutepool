package com.commutepool.app.ui.screens.support

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.RaiseTicketDto
import com.commutepool.app.data.remote.dto.TicketDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SupportViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _tickets = MutableStateFlow<List<TicketDto>>(emptyList())
    val tickets = _tickets.asStateFlow()
    private val _loading = MutableStateFlow(true)
    val loading = _loading.asStateFlow()

    init { load() }

    private fun load() {
        viewModelScope.launch {
            try { _tickets.value = api.getMyTickets() }
            finally { _loading.value = false }
        }
    }

    fun raise(category: String, subject: String, body: String) {
        viewModelScope.launch {
            runCatching { api.raiseTicket(RaiseTicketDto(category, subject, body, null)) }
            load()
        }
    }
}
