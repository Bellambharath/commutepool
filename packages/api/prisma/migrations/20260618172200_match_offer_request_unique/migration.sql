-- Migration: add @@unique([offer_id, request_id]) to matches
-- This prevents duplicate Match rows for the same offer+request pair.

CREATE UNIQUE INDEX IF NOT EXISTS "matches_offer_id_request_id_key"
  ON "matches"("offer_id", "request_id");
