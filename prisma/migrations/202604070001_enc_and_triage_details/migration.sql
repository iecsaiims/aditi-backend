ALTER TABLE "PatientTriage"
ADD COLUMN "triageData" JSONB,
ADD COLUMN "consultationStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN "dispositionStatus" TEXT NOT NULL DEFAULT 'Pending';

CREATE TABLE "EncConsultation" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "doctorName" TEXT,
  "callGivenBy" TEXT,
  "time" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EncConsultation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EncDisposition" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EncDisposition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EncDisposition_patientId_key" ON "EncDisposition"("patientId");

ALTER TABLE "EncConsultation"
ADD CONSTRAINT "EncConsultation_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "PatientTriage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EncDisposition"
ADD CONSTRAINT "EncDisposition_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "PatientTriage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
