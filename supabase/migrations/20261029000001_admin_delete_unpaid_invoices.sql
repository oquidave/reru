-- Lets admins delete an unpaid invoice raised in error (duplicate, wrong plan,
-- wrong client), and makes the audit trail able to record invoice actions.

-- audit_logs.entity_id was uuid, but reru_invoices.id is text ("INV-2026-005").
-- Every mark_invoice_paid / mark_invoice_overdue audit insert has been rejected
-- since April as a result. Text holds both uuids and invoice ids.
ALTER TABLE audit_logs
  ALTER COLUMN entity_id TYPE text USING entity_id::text;

-- reru_invoices: admins can delete invoices that have not been paid
-- Logic: a paid invoice is a receipt and proof of payment, so it is never removable.
-- Invoices with ioTec payment attempts are also protected, by the
-- reru_payments.invoice_id foreign key (no ON DELETE), not by this policy.
-- Uses app.is_admin() helper to check the caller's role
DROP POLICY IF EXISTS "Admins can delete unpaid invoices" ON reru_invoices;
CREATE POLICY "Admins can delete unpaid invoices"
  ON reru_invoices
  FOR DELETE
  TO authenticated
  USING (app.is_admin() AND status <> 'paid');
