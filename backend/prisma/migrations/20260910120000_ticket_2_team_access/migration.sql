CREATE TABLE "EmployeeInvitation" (
    "id" TEXT NOT NULL,
    "carWashId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "invitedByUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployeeInvitation_tokenHash_key" ON "EmployeeInvitation"("tokenHash");
CREATE INDEX "EmployeeInvitation_carWashId_consumedAt_expiresAt_idx" ON "EmployeeInvitation"("carWashId", "consumedAt", "expiresAt");
CREATE INDEX "EmployeeInvitation_email_consumedAt_idx" ON "EmployeeInvitation"("email", "consumedAt");
CREATE UNIQUE INDEX "EmployeeInvitation_one_pending_per_email" ON "EmployeeInvitation"("carWashId", "email") WHERE "consumedAt" IS NULL;

ALTER TABLE "EmployeeInvitation" ADD CONSTRAINT "EmployeeInvitation_carWashId_fkey" FOREIGN KEY ("carWashId") REFERENCES "CarWash"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeInvitation" ADD CONSTRAINT "EmployeeInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeInvitation" ADD CONSTRAINT "EmployeeInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
