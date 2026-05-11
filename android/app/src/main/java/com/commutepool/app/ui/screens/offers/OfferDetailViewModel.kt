package com.commutepool.app.ui.screens.offers

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.DeclineReasonDto
import com.commutepool.app.data.remote.dto.OfferDto
import com.commutepool.app.data.remote.dto.RideRequestDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OfferDetailViewModel @Inject constructor(
    private val api: ApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    private val offerId = savedStateHandle.get<String>("offerId") ?: ""

    private val _offer = MutableStateFlow<OfferDto?>(null)
    val offer = _offer.asStateFlow()
    private val _requests = MutableStateFlow<List<RideRequestDto>>(emptyList())
    val requests = _requests.asStateFlow()
    private val _loading = MutableStateFlow(true)
    val loading = _loading.asStateFlow()

    init { load() }

    private fun load() {
        viewModelScope.launch {
            try {
                _offer.value = api.getOfferDetail(offerId)
                _requests.value = api.getRequestsForOffer(offerId)
            } finally { _loading.value = false }
        }
    }

    fun accept(requestId: String) {
        viewModelScope.launch { runCatching { api.acceptRequest(requestId) }; load() }
    }

    fun decline(requestId: String) {
        viewModelScope.launch { runCatching { api.declineRequest(requestId, DeclineReasonDto("Not suitable")) }; load() }
    }
}
