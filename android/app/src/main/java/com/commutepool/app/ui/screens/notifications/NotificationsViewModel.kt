package com.commutepool.app.ui.screens.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.NotificationDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _notifications = MutableStateFlow<List<NotificationDto>>(emptyList())
    val notifications = _notifications.asStateFlow()
    private val _loading = MutableStateFlow(true)
    val loading = _loading.asStateFlow()

    init { load() }

    private fun load() {
        viewModelScope.launch {
            try { _notifications.value = api.getNotifications() }
            finally { _loading.value = false }
        }
    }

    fun markAllRead() {
        viewModelScope.launch { runCatching { api.markAllRead() }; load() }
    }
}
