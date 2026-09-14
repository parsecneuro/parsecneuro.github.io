-- Run once, or rerun safely: existing cumulative totals are preserved.
CREATE TABLE IF NOT EXISTS app_counters (
  app TEXT PRIMARY KEY CHECK (app IN ('nestapp', 'eeg-cap-viewer', 'paper-review')),
  opens INTEGER NOT NULL DEFAULT 0 CHECK (opens >= 0 AND opens <= 9007199254740991)
);

INSERT INTO app_counters (app) VALUES ('nestapp'), ('eeg-cap-viewer'), ('paper-review')
ON CONFLICT(app) DO NOTHING;

CREATE TABLE IF NOT EXISTS visit_events (
  app TEXT NOT NULL REFERENCES app_counters(app),
  event_id TEXT NOT NULL CHECK (length(event_id) = 36),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (app, event_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS visit_events_created_at ON visit_events(created_at);

CREATE TRIGGER IF NOT EXISTS increment_app_open
AFTER INSERT ON visit_events
BEGIN
  UPDATE app_counters SET opens = opens + 1 WHERE app = NEW.app;
END;
