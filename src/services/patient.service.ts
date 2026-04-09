import { randomUUID } from 'crypto';
import { Gender, PathwayType, Prisma, TriageCategory } from '@prisma/client';
import { prisma } from '../config/prisma';

type PatientRow = {
  id: string;
  crNo: string;
  name: string;
  age: number;
  gender: Gender;
  category: TriageCategory;
  area: string;
  complaint: string | null;
  pathway: PathwayType;
  contactNumber: string | null;
  triageData: unknown | null;
  consultationStatus: string;
  dispositionStatus: string;
  time: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
};

function serializePatient(patient: PatientRow) {
  return {
    ...patient,
    timestamp: patient.timestamp.toISOString(),
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString()
  };
}

export async function getPatients() {
  const patients = await prisma.$queryRaw<PatientRow[]>`
    SELECT *
    FROM "PatientTriage"
    ORDER BY "timestamp" DESC
  `;

  return patients.map(serializePatient);
}

export async function createPatient(payload: {
  crNo: string;
  name: string;
  age: number;
  gender: Gender;
  category: TriageCategory;
  area: string;
  complaint?: string;
  pathway: PathwayType;
  contactNumber?: string;
  triageData?: Prisma.InputJsonValue;
  consultationStatus?: string;
  dispositionStatus?: string;
  time: string;
  timestamp: string;
}) {
  const id = randomUUID();
  const timestamp = new Date(payload.timestamp);
  const triageData = payload.triageData === undefined ? null : JSON.stringify(payload.triageData);

  const created = await prisma.$queryRaw<PatientRow[]>`
    INSERT INTO "PatientTriage" (
      "id",
      "crNo",
      "name",
      "age",
      "gender",
      "category",
      "area",
      "complaint",
      "pathway",
      "contactNumber",
      "triageData",
      "consultationStatus",
      "dispositionStatus",
      "time",
      "timestamp",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${payload.crNo},
      ${payload.name},
      ${payload.age},
      ${payload.gender}::"Gender",
      ${payload.category}::"TriageCategory",
      ${payload.area},
      ${payload.complaint ?? null},
      ${payload.pathway}::"PathwayType",
      ${payload.contactNumber ?? null},
      ${triageData}::jsonb,
      ${payload.consultationStatus ?? 'Pending'},
      ${payload.dispositionStatus ?? 'Pending'},
      ${payload.time},
      ${timestamp},
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  return serializePatient(created[0]);
}
