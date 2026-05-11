package com.commutepool.app.data.remote

import com.commutepool.app.data.remote.dto.*
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("auth/otp/request")
    suspend fun requestOtp(@Body body: OtpRequestDto): Unit

    @POST("auth/otp/verify")
    suspend fun verifyOtp(@Body body: OtpVerifyDto): AuthTokenDto

    @POST("auth/token/refresh")
    suspend fun refreshToken(@Body body: RefreshTokenDto): AuthTokenDto

    @POST("auth/logout")
    suspend fun logout(): Unit

    // Profile
    @GET("users/profile")
    suspend fun getProfile(): UserProfileDto

    @PUT("users/profile")
    suspend fun updateProfile(@Body body: UpdateProfileDto): Unit

    // Commute
    @GET("commute/profile")
    suspend fun getCommuteProfile(): CommuteProfileDto?

    @PUT("commute/profile")
    suspend fun upsertCommuteProfile(@Body body: UpsertCommuteProfileDto): IdResponseDto

    @POST("commute/profile/pause")
    suspend fun pauseCommute(): Unit

    @POST("commute/profile/resume")
    suspend fun resumeCommute(): Unit

    // Offers
    @GET("offers/mine")
    suspend fun getMyOffers(@Query("page") page: Int = 1, @Query("pageSize") pageSize: Int = 20): List<OfferDto>

    @GET("offers/available")
    suspend fun getAvailableOffers(@Query("corridorId") corridorId: String, @Query("date") date: String): List<OfferDto>

    @GET("offers/{offerId}")
    suspend fun getOfferDetail(@Path("offerId") offerId: String): OfferDto

    @POST("offers")
    suspend fun createOffer(@Body body: CreateOfferDto): IdResponseDto

    @POST("offers/{offerId}/cancel")
    suspend fun cancelOffer(@Path("offerId") offerId: String, @Body body: CancelReasonDto): Unit

    // Requests
    @GET("requests/mine")
    suspend fun getMyRequests(@Query("page") page: Int = 1): List<RideRequestDto>

    @GET("requests/for-offer/{offerId}")
    suspend fun getRequestsForOffer(@Path("offerId") offerId: String): List<RideRequestDto>

    @POST("requests")
    suspend fun sendRequest(@Body body: SendRequestDto): IdResponseDto

    @POST("requests/{requestId}/withdraw")
    suspend fun withdrawRequest(@Path("requestId") requestId: String): Unit

    @POST("requests/{requestId}/accept")
    suspend fun acceptRequest(@Path("requestId") requestId: String): Unit

    @POST("requests/{requestId}/decline")
    suspend fun declineRequest(@Path("requestId") requestId: String, @Body body: DeclineReasonDto): Unit

    // Trips
    @GET("trips")
    suspend fun getMyTrips(@Query("page") page: Int = 1): List<TripDto>

    @GET("trips/{tripId}")
    suspend fun getTripDetail(@Path("tripId") tripId: String): TripDto

    @POST("trips/start")
    suspend fun startTrip(@Body body: StartTripDto): IdResponseDto

    @POST("trips/{tripId}/complete")
    suspend fun completeTrip(@Path("tripId") tripId: String): Unit

    @POST("trips/{tripId}/cancel")
    suspend fun cancelTrip(@Path("tripId") tripId: String, @Body body: CancelReasonDto): Unit

    @POST("trips/{tripId}/no-show")
    suspend fun noShowTrip(@Path("tripId") tripId: String): Unit

    // Ratings
    @POST("ratings")
    suspend fun submitRating(@Body body: SubmitRatingDto): IdResponseDto

    @GET("ratings/users/{userId}/score")
    suspend fun getTrustScore(@Path("userId") userId: String): TrustScoreDto

    // Notifications
    @GET("notifications")
    suspend fun getNotifications(@Query("unreadOnly") unreadOnly: Boolean = false): List<NotificationDto>

    @GET("notifications/unread-count")
    suspend fun getUnreadCount(): UnreadCountDto

    @POST("notifications/{id}/read")
    suspend fun markRead(@Path("id") id: String): Unit

    @POST("notifications/read-all")
    suspend fun markAllRead(): Unit

    // Support
    @GET("support/tickets")
    suspend fun getMyTickets(): List<TicketDto>

    @GET("support/tickets/{ticketId}")
    suspend fun getTicketDetail(@Path("ticketId") ticketId: String): TicketDetailDto

    @POST("support/tickets")
    suspend fun raiseTicket(@Body body: RaiseTicketDto): IdResponseDto

    @POST("support/tickets/{ticketId}/messages")
    suspend fun addTicketMessage(@Path("ticketId") ticketId: String, @Body body: MessageDto): IdResponseDto

    @POST("support/tickets/{ticketId}/close")
    suspend fun closeTicket(@Path("ticketId") ticketId: String): Unit

    // Safety
    @POST("safety/sos")
    suspend fun raiseSos(@Body body: SosDto): IdResponseDto

    @POST("safety/incidents")
    suspend fun reportIncident(@Body body: ReportIncidentDto): IdResponseDto

    @GET("safety/incidents")
    suspend fun getMyIncidents(): List<IncidentDto>
}
