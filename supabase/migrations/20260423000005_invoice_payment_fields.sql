-- Adds payment tracking fields to reru_invoices for admin payment recording.

ALTER TABLE reru_invoices
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_ref    text;
