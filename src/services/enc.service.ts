import { randomUUID } from 'crypto';
import { prisma } from '../config/prisma';

type ConsultationRow = {
  id: string;
  patientId: string;
  department: string;
  doctorName: string | null;
  callGivenBy: string | null;
  time: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DispositionRow = {
  id: string;
  patientId: string;
  status: string;
  time: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeConsultation(row: ConsultationRow) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function serializeDisposition(row: DispositionRow | null) {
  return row
    ? {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString()
      }
    : null;
}

export async function getEncRecord(patientId: string) {
  const [consultations, dispositions] = await Promise.all([
    prisma.$queryRaw<ConsultationRow[]>`
      SELECT *
      FROM "EncConsultation"
      WHERE "patientId" = ${patientId}
      ORDER BY "createdAt" ASC
    `,
    prisma.$queryRaw<DispositionRow[]>`
      SELECT *
      FROM "EncDisposition"
      WHERE "patientId" = ${patientId}
      LIMIT 1
    `
  ]);

  return {
    patientId,
    consultations: consultations.map(serializeConsultation),
    disposition: serializeDisposition(dispositions[0] ?? null)
  };
}

export async function addEncConsultation(
  patientId: string,
  payload: {
    department: string;
    doctorName?: string;
    callGivenBy?: string;
    time?: string;
    completed: boolean;
  }
) {
  const id = randomUUID();
  const created = await prisma.$queryRaw<ConsultationRow[]>`
    INSERT INTO "EncConsultation" (
      "id",
      "patientId",
      "department",
      "doctorName",
      "callGivenBy",
      "time",
      "completed",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${patientId},
      ${payload.department},
      ${payload.doctorName ?? null},
      ${payload.callGivenBy ?? null},
      ${payload.time ?? null},
      ${payload.completed},
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  if (payload.completed) {
    await prisma.$executeRaw`
      UPDATE "PatientTriage"
      SET "consultationStatus" = 'Completed', "updatedAt" = NOW()
      WHERE "id" = ${patientId}
    `;
  }

  return serializeConsultation(created[0]);
}

export async function saveEncDisposition(
  patientId: string,
  payload: {
    status: string;
    time: string;
    notes?: string;
  }
) {
  const id = randomUUID();
  const saved = await prisma.$queryRaw<DispositionRow[]>`
    INSERT INTO "EncDisposition" (
      "id",
      "patientId",
      "status",
      "time",
      "notes",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${patientId},
      ${payload.status},
      ${payload.time},
      ${payload.notes ?? null},
      NOW(),
      NOW()
    )
    ON CONFLICT ("patientId") DO UPDATE SET
      "status" = EXCLUDED."status",
      "time" = EXCLUDED."time",
      "notes" = EXCLUDED."notes",
      "updatedAt" = NOW()
    RETURNING *
  `;

  await prisma.$executeRaw`
    UPDATE "PatientTriage"
    SET "dispositionStatus" = 'Completed', "updatedAt" = NOW()
    WHERE "id" = ${patientId}
  `;

  return serializeDisposition(saved[0]);
}
