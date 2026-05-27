-- Auto-generate reru_invoices.id so inserts need not supply one.
-- Fixes the admin "Generate Invoices" route (POST /api/admin/invoices), which
-- inserts rows without an id; the text PK previously had no default, so every
-- generate attempt failed with a NOT NULL violation.
-- Sequence starts at 1000 to avoid colliding with existing INV-2026-001..005.

CREATE SEQUENCE IF NOT EXISTS reru_invoice_seq START 1000;

ALTER TABLE reru_invoices
  ALTER COLUMN id SET DEFAULT 'INV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('reru_invoice_seq')::text, 4, '0');
