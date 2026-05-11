package com.commutepool.app.ui.screens.offers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.OfferDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OffersViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _offers = MutableStateFlow<List<OfferDto>>(emptyList())
    val offers = _offers.asStateFlow()
    private val _loading = MutableStateFlow(true)
    val loading = _loading.asStateFlow()

    init { load() }

    private fun load() {
        viewModelScope.launch {
            try { _offers.value = api.getMyOffers() }
            finally { _loading.value = false }
        }
    }
}
