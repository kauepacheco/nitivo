CREATE TABLE "AppointmentRescheduleChange" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "carWashId" TEXT NOT NULL,
  "previousBoxId" TEXT NOT NULL,
  "previousStartsAt" TIMESTAMPTZ(3) NOT NULL,
  "previousEndsAt" TIMESTAMPTZ(3) NOT NULL,
  "requestedAt" TIMESTAMPTZ(3) NOT NULL,
  "rescheduledAt" TIMESTAMPTZ(3) NOT NULL,
  "rescheduledByMembershipId" TEXT NOT NULL,

  CONSTRAINT "AppointmentRescheduleChange_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentRescheduleChange_appointmentId_carWashId_fkey"
    FOREIGN KEY ("appointmentId", "carWashId") REFERENCES "Appointment"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AppointmentRescheduleChange_previousBoxId_carWashId_fkey"
    FOREIGN KEY ("previousBoxId", "carWashId") REFERENCES "Box"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AppointmentRescheduleChange_rescheduledByMembershipId_carWashId_fkey"
    FOREIGN KEY ("rescheduledByMembershipId", "carWashId") REFERENCES "Membership"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "AppointmentRescheduleChange_appointmentId_rescheduledAt_idx"
  ON "AppointmentRescheduleChange"("appointmentId", "rescheduledAt");
CREATE INDEX "AppointmentRescheduleChange_carWashId_rescheduledAt_idx"
  ON "AppointmentRescheduleChange"("carWashId", "rescheduledAt");
CREATE INDEX "AppointmentRescheduleChange_rescheduledByMembershipId_carWashId_idx"
  ON "AppointmentRescheduleChange"("rescheduledByMembershipId", "carWashId");
