namespace CommutePool.Shared.Enums;

public enum PickupMode { RoutePointOnly, RoutePlusNearRider }
public enum PickupOptionType { RoutePoint, NearRiderPoint }
public enum RideOfferStatus { Active, Paused, Closed }
public enum RideRequestStatus { Active, Paused, Closed }
public enum MatchStatus { Proposed, PendingUserAction, Accepted, Rejected, Expired, RecurringActive }
public enum RecurringPairStatus { Active, Paused, Cancelled }
public enum TripStatus { Scheduled, Arriving, Started, InProgress, Completed, Cancelled, Reported }
