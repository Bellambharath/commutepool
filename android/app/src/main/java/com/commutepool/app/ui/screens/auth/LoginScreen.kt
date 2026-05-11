package com.commutepool.app.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.commutepool.app.ui.navigation.Routes

@Composable
fun LoginScreen(
    navController: NavController,
    vm: AuthViewModel = hiltViewModel()
) {
    val uiState by vm.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("CommutePool", fontSize = 32.sp, fontWeight = FontWeight.Bold)
        Text("Ride safe. Ride smart.", style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(Modifier.height(48.dp))

        OutlinedTextField(
            value = uiState.phone,
            onValueChange = vm::onPhoneChanged,
            label = { Text("Mobile number") },
            prefix = { Text("+91 ") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(16.dp))

        Button(
            onClick = {
                vm.requestOtp { navController.navigate(Routes.otpVerify(uiState.phone)) }
            },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            enabled = uiState.phone.length == 10 && !uiState.loading
        ) {
            if (uiState.loading) CircularProgressIndicator(modifier = Modifier.size(20.dp))
            else Text("Get OTP")
        }

        uiState.error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
    }
}
