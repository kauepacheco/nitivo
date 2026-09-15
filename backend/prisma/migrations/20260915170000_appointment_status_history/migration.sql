CREATE TABLE "AppointmentStatusChange" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "carWashId" TEXT NOT NULL,
  "previousStatus" "AppointmentStatus" NOT NULL,
  "status" "AppointmentStatus" NOT NULL,
  "changedByMembershipId" TEXT NOT NULL,
  "changedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AppointmentStatusChange_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentStatusChange_changedByMembershipId_carWashId_fkey" FOREIGN KEY ("changedByMembershipId", "carWashId") REFERENCES "Membership"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_id_carWashId_key" UNIQUE ("id", "carWashId");

ALTER TABLE "AppointmentStatusChange"
  ADD CONSTRAINT "AppointmentStatusChange_appointmentId_carWashId_fkey"
  FOREIGN KEY ("appointmentId", "carWashId") REFERENCES "Appointment"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "AppointmentStatusChange_appointmentId_changedAt_idx" ON "AppointmentStatusChange"("appointmentId", "changedAt");
CREATE INDEX "AppointmentStatusChange_carWashId_changedAt_idx" ON "AppointmentStatusChange"("carWashId", "changedAt");
CREATE INDEX "AppointmentStatusChange_changedByMembershipId_carWashId_idx" ON "AppointmentStatusChange"("changedByMembershipId", "carWashId");
