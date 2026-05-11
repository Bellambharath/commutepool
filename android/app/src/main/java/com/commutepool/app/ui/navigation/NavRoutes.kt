package com.commutepool.app.ui.navigation

object Routes {
    const val SPLASH = "splash"
    const val LOGIN = "auth/login"
    const val OTP_VERIFY = "auth/otp/{phone}"
    const val HOME = "home"
    const val COMMUTE_SETUP = "commute/setup"
    const val OFFERS = "offers"
    const val OFFER_DETAIL = "offers/{offerId}"
    const val CREATE_OFFER = "offers/create"
    const val REQUESTS = "requests"
    const val TRIPS = "trips"
    const val TRIP_DETAIL = "trips/{tripId}"
    const val NOTIFICATIONS = "notifications"
    const val SUPPORT = "support"
    const val SUPPORT_TICKET_DETAIL = "support/{ticketId}"
    const val SAFETY_SOS = "safety/sos"
    const val SAFETY_REPORT = "safety/report"
    const val PROFILE = "profile"
    const val VERIFICATION = "verification"

    fun otpVerify(phone: String) = "auth/otp/$phone"
    fun offerDetail(offerId: String) = "offers/$offerId"
    fun tripDetail(tripId: String) = "trips/$tripId"
    fun ticketDetail(ticketId: String) = "support/$ticketId"
}
