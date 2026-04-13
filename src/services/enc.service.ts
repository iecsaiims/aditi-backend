import { prisma } from '../config/prisma';
import type { AuthUser } from '../utils/auth';

type ConsultationRow = {
  id: string;
  patientId: string;
  department: string;
  doctorName: string | null;
  callGivenBy: string | null;
  date: string | null;
  time: string | null;
  completed: boolean;
  submittedByUserId: string | null;
  submittedBy: string | null;
  designation: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DispositionRow = {
  id: string;
  patientId: string;
  department: string;
  status: string;
  date: string | null;
  time: string;
  notes: string | null;
  submittedByUserId: string | null;
  submittedBy: string | null;
  designation: string | null;
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
  const [consultations, disposition] = await Promise.all([
    prisma.encConsultation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.encDisposition.findUnique({
      where: { patientId },
    }),
  ]);

  return {
    patientId,
    consultations: consultations.map((item) => serializeConsultation(item as ConsultationRow)),
    disposition: serializeDisposition((disposition as DispositionRow | null) ?? null)
  };
}

export async function addEncConsultation(
  patientId: string,
  payload: {
    department: string;
    doctorName?: string;
    callGivenBy?: string;
    date?: string;
    time?: string;
    completed: boolean;
  },
  authUser: AuthUser
) {
  if (payload.completed) {
    const existingFinal = await prisma.encConsultation.findFirst({
      where: { patientId, completed: true },
    });

    if (existingFinal) {
      throw new Error('Final consultation already submitted for this patient');
    }
  }

  const created = await prisma.encConsultation.create({
    data: {
      patientId,
      department: payload.department,
      doctorName: payload.doctorName ?? null,
      callGivenBy: payload.callGivenBy ?? null,
      date: payload.date ?? null,
      time: payload.time ?? null,
      completed: payload.completed,
      submittedByUserId: authUser.id,
      submittedBy: authUser.displayName,
      designation: authUser.designation ?? null,
    },
  });

  if (payload.completed) {
    await prisma.patientTriage.update({
      where: { id: patientId },
      data: {
        consultationStatus: 'Completed',
      },
    });
  }

  return serializeConsultation(created as ConsultationRow);
}

export async function saveEncDisposition(
  patientId: string,
  payload: {
    department: string;
    status: string;
    date?: string;
    time: string;
    notes?: string;
  },
  authUser: AuthUser
) {
  const saved = await prisma.encDisposition.upsert({
    where: { patientId },
    create: {
      patientId,
      department: payload.department,
      status: payload.status,
      date: payload.date ?? null,
      time: payload.time,
      notes: payload.notes ?? null,
      submittedByUserId: authUser.id,
      submittedBy: authUser.displayName,
      designation: authUser.designation ?? null,
    },
    update: {
      department: payload.department,
      status: payload.status,
      date: payload.date ?? null,
      time: payload.time,
      notes: payload.notes ?? null,
      submittedByUserId: authUser.id,
      submittedBy: authUser.displayName,
      designation: authUser.designation ?? null,
    },
  });

  await prisma.patientTriage.update({
    where: { id: patientId },
    data: {
      dispositionStatus: 'Completed',
    },
  });

  return serializeDisposition(saved as DispositionRow);
}
