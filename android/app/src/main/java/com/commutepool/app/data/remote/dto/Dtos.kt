package com.commutepool.app.data.remote.dto

import com.google.gson.annotations.SerializedName

// Auth
data class OtpRequestDto(val phone: String)
data class OtpVerifyDto(val phone: String, val otp: String)
data class RefreshTokenDto(val refreshToken: String)
data class AuthTokenDto(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long
)

// Common
data class IdResponseDto(val id: String? = null, val offerId: String? = null,
    val tripId: String? = null, val requestId: String? = null,
    val ticketId: String? = null, val incidentId: String? = null)
data class CancelReasonDto(val reason: String)
data class DeclineReasonDto(val reason: String)
data class MessageDto(val message: String)

// User
data class UserProfileDto(
    val id: String, val phone: String, val name: String?,
    val email: String?, val gender: String?,
    val trustScore: Double, val ownerEligibility: String,
    val createdAt: String
)
data class UpdateProfileDto(val name: String?, val email: String?, val gender: String?)

// Commute
data class CommuteProfileDto(
    val id: String, val corridorId: String, val corridorName: String,
    val homeArea: String, val homeLat: Double, val homeLng: Double,
    val officeArea: String, val officeLat: Double, val officeLng: Double,
    val morningDepartureTime: String, val eveningDepartureTime: String,
    val activeDays: List<String>, val paused: Boolean
)
data class UpsertCommuteProfileDto(
    val corridorId: String, val homeArea: String,
    val homeLat: Double, val homeLng: Double,
    val officeArea: String, val officeLat: Double, val officeLng: Double,
    val morningDepartureTime: String, val eveningDepartureTime: String,
    val activeDays: List<String>
)

// Offer
data class OfferDto(
    val id: String, val ownerId: String, val ownerName: String,
    val vehicleId: String, val vehicleRegistrationNo: String,
    val direction: String, val offerDate: String, val departureTime: String,
    val availableSeats: Int, val acceptedSeats: Int,
    val startLat: Double, val startLng: Double,
    val endLat: Double, val endLng: Double,
    val status: String, val createdAt: String
)
data class CreateOfferDto(
    val vehicleId: String, val direction: String, val offerDate: String,
    val departureTime: String, val availableSeats: Int,
    val startLat: Double, val startLng: Double,
    val endLat: Double, val endLng: Double
)

// Request
data class RideRequestDto(
    val id: String, val offerId: String, val riderId: String, val riderName: String,
    val status: String, val note: String?, val declineReason: String?, val createdAt: String
)
data class SendRequestDto(val offerId: String, val note: String?)

// Trip
data class TripDto(
    val id: String, val matchId: String, val ownerId: String, val ownerName: String,
    val riderId: String, val riderName: String, val status: String,
    val startedAt: String?, val completedAt: String?,
    val cancelledAt: String?, val cancelReason: String?, val createdAt: String
)
data class StartTripDto(val matchId: String)

// Rating
data class SubmitRatingDto(val tripId: String, val ratedUserId: String, val stars: Int, val comment: String?)
data class TrustScoreDto(val userId: String, val score: Double, val totalRatings: Int, val lastComputedAt: String)

// Notification
data class NotificationDto(
    val id: String, val title: String, val body: String,
    val category: String, val deepLink: String?, val read: Boolean, val createdAt: String
)
data class UnreadCountDto(val count: Int)

// Support
data class TicketDto(
    val id: String, val category: String, val subject: String,
    val status: String, val assignedAdminId: String?,
    val createdAt: String, val updatedAt: String
)
data class TicketDetailDto(
    val id: String, val userId: String, val category: String,
    val subject: String, val status: String, val resolution: String?,
    val tripId: String?, val messages: List<TicketMessageDto>, val createdAt: String
)
data class TicketMessageDto(
    val id: String, val sentByUserId: String, val senderName: String,
    val message: String, val createdAt: String
)
data class RaiseTicketDto(
    val category: String, val subject: String,
    val body: String, val tripId: String?
)

// Safety
data class SosDto(val tripId: String?, val lat: Double, val lng: Double, val note: String?)
data class ReportIncidentDto(
    val tripId: String?, val incidentType: String, val description: String
)
data class IncidentDto(
    val id: String, val reportedByUserId: String, val reporterName: String,
    val tripId: String?, val incidentType: String, val status: String,
    val description: String, val isSos: Boolean,
    val lat: Double?, val lng: Double?,
    val createdAt: String, val resolvedAt: String?
)
