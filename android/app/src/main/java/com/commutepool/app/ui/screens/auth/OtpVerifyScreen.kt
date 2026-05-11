package com.commutepool.app.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.commutepool.app.ui.navigation.Routes

@Composable
fun OtpVerifyScreen(
    navController: NavController,
    vm: AuthViewModel = hiltViewModel()
) {
    val uiState by vm.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Enter OTP", style = MaterialTheme.typography.headlineMedium)
        Text("Sent to +91 ${uiState.phone}", style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(Modifier.height(32.dp))

        OutlinedTextField(
            value = uiState.otp,
            onValueChange = vm::onOtpChanged,
            label = { Text("6-digit OTP") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(16.dp))

        Button(
            onClick = {
                vm.verifyOtp {
                    navController.navigate(Routes.OFFERS) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            enabled = uiState.otp.length == 6 && !uiState.loading
        ) {
            if (uiState.loading) CircularProgressIndicator(modifier = Modifier.size(20.dp))
            else Text("Verify & Login")
        }

        uiState.error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
    }
}
