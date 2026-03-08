-- Fix: timestamp_ms overflows int (32bit max ~2.1B) with Unix ms timestamps (~1.77T)
ALTER TABLE transcripts ALTER COLUMN timestamp_ms TYPE bigint;
