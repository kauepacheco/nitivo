ALTER TABLE "CarWash"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
ADD COLUMN "minimumBookingNoticeMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN "bookingHorizonDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "changeNoticeMinutes" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "CarWash"
ADD CONSTRAINT "CarWash_scheduling_policy_values"
CHECK (
  "timezone" = 'America/Sao_Paulo'
  AND "minimumBookingNoticeMinutes" BETWEEN 0 AND 10080
  AND "bookingHorizonDays" BETWEEN 1 AND 365
  AND "changeNoticeMinutes" BETWEEN 0 AND 10080
  AND "slotIntervalMinutes" BETWEEN 5 AND 1440
);

CREATE TABLE "Box" (
  "id" TEXT NOT NULL,
  "carWashId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Box_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Box_name_not_blank" CHECK (length(btrim("name")) BETWEEN 1 AND 80),
  CONSTRAINT "Box_carWashId_fkey" FOREIGN KEY ("carWashId") REFERENCES "CarWash"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Box_id_carWashId_key" ON "Box"("id", "carWashId");
CREATE UNIQUE INDEX "Box_carWashId_name_key" ON "Box"("carWashId", "name");
CREATE INDEX "Box_carWashId_active_createdAt_idx" ON "Box"("carWashId", "active", "createdAt");

CREATE TABLE "WeeklyOpeningHour" (
  "id" TEXT NOT NULL,
  "carWashId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "opensAtMinute" INTEGER NOT NULL,
  "closesAtMinute" INTEGER NOT NULL,
  CONSTRAINT "WeeklyOpeningHour_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeeklyOpeningHour_valid_interval" CHECK (
    "weekday" BETWEEN 0 AND 6
    AND "opensAtMinute" BETWEEN 0 AND 1439
    AND "closesAtMinute" BETWEEN 1 AND 1440
    AND "opensAtMinute" < "closesAtMinute"
  ),
  CONSTRAINT "WeeklyOpeningHour_carWashId_fkey" FOREIGN KEY ("carWashId") REFERENCES "CarWash"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WeeklyOpeningHour_carWashId_weekday_key" ON "WeeklyOpeningHour"("carWashId", "weekday");
CREATE INDEX "WeeklyOpeningHour_carWashId_weekday_idx" ON "WeeklyOpeningHour"("carWashId", "weekday");

CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW');

CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "carWashId" TEXT NOT NULL,
  "boxId" TEXT NOT NULL,
  "serviceOfferingId" TEXT NOT NULL,
  "startsAt" TIMESTAMPTZ(3) NOT NULL,
  "endsAt" TIMESTAMPTZ(3) NOT NULL,
  "serviceName" TEXT NOT NULL,
  "servicePriceInCents" INTEGER NOT NULL,
  "serviceDurationInMinutes" INTEGER NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_valid_snapshot_and_interval" CHECK (
    length(btrim("serviceName")) > 0
    AND "servicePriceInCents" >= 0
    AND "serviceDurationInMinutes" > 0
    AND "startsAt" < "endsAt"
  ),
  CONSTRAINT "Appointment_box_tenant_fkey" FOREIGN KEY ("boxId", "carWashId") REFERENCES "Box"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_service_tenant_fkey" FOREIGN KEY ("serviceOfferingId", "carWashId") REFERENCES "ServiceOffering"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Appointment_carWashId_startsAt_endsAt_idx" ON "Appointment"("carWashId", "startsAt", "endsAt");
CREATE INDEX "Appointment_boxId_startsAt_endsAt_idx" ON "Appointment"("boxId", "startsAt", "endsAt");
