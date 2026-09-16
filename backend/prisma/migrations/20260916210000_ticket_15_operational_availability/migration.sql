CREATE TYPE "OperationalExceptionKind" AS ENUM ('CLOSED', 'SPECIAL_HOURS');

CREATE TABLE "OperationalException" (
  "id" TEXT NOT NULL,
  "carWashId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "kind" "OperationalExceptionKind" NOT NULL,
  "opensAtMinute" INTEGER,
  "closesAtMinute" INTEGER,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationalException_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OperationalException_valid_hours" CHECK (
    ("kind" = 'CLOSED' AND "opensAtMinute" IS NULL AND "closesAtMinute" IS NULL)
    OR
    ("kind" = 'SPECIAL_HOURS' AND "opensAtMinute" BETWEEN 0 AND 1439
      AND "closesAtMinute" BETWEEN 1 AND 1440
      AND "opensAtMinute" < "closesAtMinute")
  ),
  CONSTRAINT "OperationalException_carWashId_fkey" FOREIGN KEY ("carWashId") REFERENCES "CarWash"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OperationalException_carWashId_date_key" ON "OperationalException"("carWashId", "date");

CREATE TABLE "AvailabilityBlock" (
  "id" TEXT NOT NULL,
  "carWashId" TEXT NOT NULL,
  "boxId" TEXT,
  "startsAt" TIMESTAMPTZ(3) NOT NULL,
  "endsAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AvailabilityBlock_valid_interval" CHECK ("startsAt" < "endsAt"),
  CONSTRAINT "AvailabilityBlock_carWashId_fkey" FOREIGN KEY ("carWashId") REFERENCES "CarWash"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AvailabilityBlock_box_tenant_fkey" FOREIGN KEY ("boxId", "carWashId") REFERENCES "Box"("id", "carWashId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AvailabilityBlock_carWashId_startsAt_endsAt_idx" ON "AvailabilityBlock"("carWashId", "startsAt", "endsAt");
CREATE INDEX "AvailabilityBlock_boxId_startsAt_endsAt_idx" ON "AvailabilityBlock"("boxId", "startsAt", "endsAt");
