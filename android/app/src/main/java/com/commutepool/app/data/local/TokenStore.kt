package com.commutepool.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

val Context.dataStore by preferencesDataStore(name = "commutepool_tokens")

@Singleton
class TokenStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val ACCESS_KEY = stringPreferencesKey("access_token")
    private val REFRESH_KEY = stringPreferencesKey("refresh_token")

    suspend fun accessToken(): String? =
        context.dataStore.data.map { it[ACCESS_KEY] }.firstOrNull()

    suspend fun refreshToken(): String? =
        context.dataStore.data.map { it[REFRESH_KEY] }.firstOrNull()

    suspend fun save(access: String, refresh: String) {
        context.dataStore.edit {
            it[ACCESS_KEY] = access
            it[REFRESH_KEY] = refresh
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }

    // Called from interceptor — does a synchronous refresh
    suspend fun refreshAccessToken(): String? = null // Handled via repository layer
}
