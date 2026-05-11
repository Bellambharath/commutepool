package com.commutepool.app.data.remote

import com.commutepool.app.data.local.TokenStore
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenStore: TokenStore
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenStore.accessToken() }
        val request = if (token != null) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else chain.request()

        val response = chain.proceed(request)

        if (response.code == 401) {
            response.close()
            val newToken = runBlocking { tokenStore.refreshAccessToken() } ?: return response
            val retried = chain.request().newBuilder()
                .header("Authorization", "Bearer $newToken")
                .build()
            return chain.proceed(retried)
        }
        return response
    }
}
