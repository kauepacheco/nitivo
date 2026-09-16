ALTER TABLE "AppointmentStatusChange"
  ADD COLUMN "cancellationRequestedAt" TIMESTAMPTZ(3),
  ADD COLUMN "cancellationReason" TEXT;

ALTER TABLE "AppointmentStatusChange"
  ADD CONSTRAINT "AppointmentStatusChange_cancellation_metadata"
  CHECK (
    (status = 'CANCELED') OR
    ("cancellationRequestedAt" IS NULL AND "cancellationReason" IS NULL)
  );
