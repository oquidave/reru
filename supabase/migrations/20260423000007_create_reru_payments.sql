-- In-app mobile-money payment attempts (ioTec collections).
-- One row per attempt to pay an invoice. The invoice is only flipped to 'paid'
-- once a collection is confirmed successful against ioTec's status endpoint.

CREATE TABLE IF NOT EXISTS reru_payments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- reru_invoices.id is a human-readable text id (e.g. "INV-2026-005").
  invoice_id    text        NOT NULL REFERENCES reru_invoices(id),
  client_id     uuid        NOT NULL REFERENCES reru_clients(id),
  -- Our reference sent to ioTec as externalId; unique per attempt.
  external_id   text        NOT NULL UNIQUE,
  -- ioTec transaction id, populated once the collection is created.
  iotec_id      text,
  amount        integer     NOT NULL,
  currency      text        NOT NULL DEFAULT 'UGX',
  payer_phone   text        NOT NULL,
  vendor        text,
  -- pending | sent | success | failed | cancelled
  status        text        NOT NULL DEFAULT 'pending',
  status_code   text,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS reru_payments_invoice_id_idx ON reru_payments (invoice_id);
CREATE INDEX IF NOT EXISTS reru_payments_iotec_id_idx   ON reru_payments (iotec_id);

ALTER TABLE reru_payments ENABLE ROW LEVEL SECURITY;

-- Clients can read their own payment attempts.
-- Logic: a client only ever sees payments tied to their reru_clients row.
CREATE POLICY "Clients can view own payments"
  ON reru_payments
  FOR SELECT
  TO authenticated
  USING (client_id = app.current_client_id());

-- Admins can read all payments for support and reconciliation.
CREATE POLICY "Admins can view all payments"
  ON reru_payments
  FOR SELECT
  TO authenticated
  USING (app.is_admin());

-- No INSERT/UPDATE policies: all writes go through the service role
-- (payment initiation, ioTec webhook, and status reconciliation).
