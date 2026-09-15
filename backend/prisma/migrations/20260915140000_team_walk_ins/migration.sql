ALTER TABLE "Appointment"
ADD COLUMN "createdByMembershipId" TEXT;

ALTER TABLE "Membership"
ADD CONSTRAINT "Membership_id_carWashId_key" UNIQUE ("id", "carWashId");

CREATE INDEX "Appointment_createdByMembershipId_carWashId_idx"
ON "Appointment"("createdByMembershipId", "carWashId");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_createdByMembershipId_carWashId_fkey"
FOREIGN KEY ("createdByMembershipId", "carWashId")
REFERENCES "Membership"("id", "carWashId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment"
DROP CONSTRAINT "Appointment_public_required_data",
ADD CONSTRAINT "Appointment_origin_required_data" CHECK (
  "origin" IN ('LEGACY', 'PUBLIC', 'TEAM') AND
  (
    "origin" = 'LEGACY' OR
    (
      "origin" = 'PUBLIC' AND
      "customerId" IS NOT NULL AND
      "vehicleId" IS NOT NULL AND
      "attemptHash" IS NOT NULL AND
      "requestHash" IS NOT NULL AND
      "createdByMembershipId" IS NULL
    ) OR
    (
      "origin" = 'TEAM' AND
      "customerId" IS NOT NULL AND
      "vehicleId" IS NOT NULL AND
      "attemptHash" IS NULL AND
      "requestHash" IS NULL AND
      "createdByMembershipId" IS NOT NULL
    )
  )
);
