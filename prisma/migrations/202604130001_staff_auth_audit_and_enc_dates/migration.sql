ALTER TABLE "User"
ADD COLUMN "email" TEXT,
ADD COLUMN "designation" TEXT;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

ALTER TABLE "PatientTriage"
ADD COLUMN "respiratorySupport" TEXT,
ADD COLUMN "submittedByUserId" TEXT,
ADD COLUMN "submittedBy" TEXT,
ADD COLUMN "designation" TEXT;

ALTER TABLE "EncConsultation"
ADD COLUMN "date" TEXT,
ADD COLUMN "submittedByUserId" TEXT,
ADD COLUMN "submittedBy" TEXT,
ADD COLUMN "designation" TEXT;

ALTER TABLE "EncDisposition"
ADD COLUMN "date" TEXT,
ADD COLUMN "submittedByUserId" TEXT,
ADD COLUMN "submittedBy" TEXT,
ADD COLUMN "designation" TEXT;

ALTER TABLE "PatientTriage"
ADD CONSTRAINT "PatientTriage_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EncConsultation"
ADD CONSTRAINT "EncConsultation_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EncDisposition"
ADD CONSTRAINT "EncDisposition_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
