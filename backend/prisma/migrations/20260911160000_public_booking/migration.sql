CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY, "carWashId" TEXT NOT NULL, "name" TEXT NOT NULL, "phone" TEXT NOT NULL,
  UNIQUE ("id", "carWashId"),
  FOREIGN KEY ("carWashId") REFERENCES "CarWash"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (length(btrim("name")) BETWEEN 1 AND 100 AND "phone" ~ '^[0-9]{10,15}$')
);
CREATE TABLE "Vehicle" (
  "id" TEXT PRIMARY KEY, "carWashId" TEXT NOT NULL, "customerId" TEXT NOT NULL, "plate" TEXT NOT NULL,
  UNIQUE ("id", "customerId", "carWashId"),
  FOREIGN KEY ("carWashId") REFERENCES "CarWash"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("customerId", "carWashId") REFERENCES "Customer"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK ("plate" ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$')
);
-- Ocupações do ticket 5 não tinham cliente/veículo; preservar sem inventar dados pessoais.
ALTER TABLE "Appointment"
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "vehicleId" TEXT,
  ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'LEGACY',
  ADD COLUMN "attemptHash" TEXT,
  ADD COLUMN "requestHash" TEXT,
  ADD CONSTRAINT "Appointment_customer_tenant_fkey" FOREIGN KEY ("customerId", "carWashId") REFERENCES "Customer"("id", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Appointment_vehicle_customer_tenant_fkey" FOREIGN KEY ("vehicleId", "customerId", "carWashId") REFERENCES "Vehicle"("id", "customerId", "carWashId") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Appointment_public_required_data" CHECK (
    "origin" IN ('LEGACY', 'PUBLIC') AND
    ("origin" <> 'PUBLIC' OR ("customerId" IS NOT NULL AND "vehicleId" IS NOT NULL AND "attemptHash" IS NOT NULL AND "requestHash" IS NOT NULL))
  ),
  ADD CONSTRAINT "Appointment_no_overlap" EXCLUDE USING gist (
    "boxId" WITH =, tstzrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE (status IN ('CONFIRMED', 'IN_PROGRESS'));
CREATE UNIQUE INDEX "Appointment_carWashId_attemptHash_key" ON "Appointment"("carWashId", "attemptHash");
