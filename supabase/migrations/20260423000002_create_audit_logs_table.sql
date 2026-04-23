-- Immutable audit trail for all sensitive admin operations.

CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid        NOT NULL REFERENCES auth.users(id),
  action     text        NOT NULL,
  entity     text        NOT NULL,
  entity_id  uuid        NOT NULL,
  old_value  jsonb,
  new_value  jsonb,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies added in migration 20260423000004 after helper functions exist
