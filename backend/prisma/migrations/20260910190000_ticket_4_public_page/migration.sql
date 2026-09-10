ALTER TABLE "CarWash" ADD COLUMN "operationalContactPhone" TEXT;

ALTER TABLE "CarWash"
ADD CONSTRAINT "CarWash_operational_contact_phone_format"
CHECK (
  "operationalContactPhone" IS NULL
  OR "operationalContactPhone" ~ '^[0-9]{10,15}$'
);
