# Trip Module

Owns trip lifecycle, checkpoints, status transitions, and trip control rules.

## Commands
- ScheduleTrip
- MarkTripArriving
- StartTrip
- RecordTripCheckpoint
- CompleteTrip
- CancelTrip

## Queries
- GetMyTrips
- GetTripDetail
- GetActiveTrip
- GetTripTimeline

## Events
- TripScheduled
- TripArriving
- TripStarted
- TripCheckpointRecorded
- TripCompleted
- TripCancelled

## State Machine
SCHEDULED -> ARRIVING -> STARTED -> IN_PROGRESS -> COMPLETED
                                  -> CANCELLED
                                  -> REPORTED
