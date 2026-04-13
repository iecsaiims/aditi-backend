import { Gender, PathwayType, Prisma, TriageCategory } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { AuthUser } from '../utils/auth';

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
  respiratorySupport: string | null;
  consultationStatus: string;
  dispositionStatus: string;
  time: string;
  timestamp: Date;
  submittedByUserId: string | null;
  submittedBy: string | null;
  designation: string | null;
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
  respiratorySupport: string;
  consultationStatus?: string;
  dispositionStatus?: string;
  time: string;
  timestamp: string;
}, authUser: AuthUser) {
  const timestamp = new Date(payload.timestamp);
  const created = await prisma.patientTriage.create({
    data: {
      crNo: payload.crNo,
      name: payload.name,
      age: payload.age,
      gender: payload.gender,
      category: payload.category,
      area: payload.area,
      complaint: payload.complaint ?? null,
      pathway: payload.pathway,
      contactNumber: payload.contactNumber ?? null,
      triageData: payload.triageData ?? Prisma.JsonNull,
      respiratorySupport: payload.respiratorySupport,
      consultationStatus: payload.consultationStatus ?? 'Pending',
      dispositionStatus: payload.dispositionStatus ?? 'Pending',
      time: payload.time,
      timestamp,
      submittedByUserId: authUser.id,
      submittedBy: authUser.displayName,
      designation: authUser.designation ?? null,
    },
  });

  return serializePatient(created as PatientRow);
}
