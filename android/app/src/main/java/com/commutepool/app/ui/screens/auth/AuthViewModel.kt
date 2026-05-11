package com.commutepool.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.commutepool.app.data.local.TokenStore
import com.commutepool.app.data.remote.ApiService
import com.commutepool.app.data.remote.dto.OtpRequestDto
import com.commutepool.app.data.remote.dto.OtpVerifyDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val phone: String = "",
    val otp: String = "",
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val api: ApiService,
    private val tokenStore: TokenStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState = _uiState.asStateFlow()

    fun onPhoneChanged(value: String) { _uiState.value = _uiState.value.copy(phone = value.take(10)) }
    fun onOtpChanged(value: String) { _uiState.value = _uiState.value.copy(otp = value.take(6)) }

    fun requestOtp(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            try {
                api.requestOtp(OtpRequestDto("+91${_uiState.value.phone}"))
                onSuccess()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            } finally {
                _uiState.value = _uiState.value.copy(loading = false)
            }
        }
    }

    fun verifyOtp(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            try {
                val result = api.verifyOtp(OtpVerifyDto("+91${_uiState.value.phone}", _uiState.value.otp))
                tokenStore.save(result.accessToken, result.refreshToken)
                onSuccess()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = "Invalid OTP. Try again.")
            } finally {
                _uiState.value = _uiState.value.copy(loading = false)
            }
        }
    }
}
