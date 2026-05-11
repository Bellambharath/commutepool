# Outbox Module

Infrastructure module responsible for persisting and publishing domain events safely after DB commits.

All command modules write to the outbox_events table within the same DB transaction as their state change. The OutboxRelayWorker polls and processes pending events.

## Workers
- OutboxRelayWorker
- MatchGenerationWorker
- PickupOptionWorker
- NotificationDispatchWorker
- IncidentEscalationWorker
- AnalyticsProjectionWorker
- SupportReminderWorker
- TrustScoreProjectionWorker

## Event Envelope
```json
{
  "eventId": "evt_uuid",
  "eventType": "TripStarted",
  "eventVersion": 1,
  "aggregateType": "Trip",
  "aggregateId": "trip_uuid",
  "occurredAt": "2026-05-11T17:35:10Z",
  "payload": {}
}
```
