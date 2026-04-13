import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { hashPassword, signAuthToken, verifyPassword } from '../utils/auth';

type LoginInput = {
  email: string;
  password: string;
};

type StaffCreateInput = {
  name: string;
  email: string;
  password: string;
  designation: string;
  role: string;
};

type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

type SerializedUser = ReturnType<typeof serializeUser>;

function serializeUser(user: {
  id: string;
  email: string | null;
  role: string;
  displayName: string;
  designation: string | null;
}) {
  return {
    id: user.id,
    email: user.email ?? '',
    role: user.role,
    displayName: user.displayName,
    designation: user.designation ?? '',
  };
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.password)) {
    throw new Error('Invalid email or password');
  }

  const serializedUser = serializeUser(user);

  return {
    token: signAuthToken(serializedUser, env.authSecret, env.authTokenTtlHours),
    user: serializedUser
  };
}

export async function createStaffUser(input: StaffCreateInput) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email },
        { username: input.email },
      ],
    },
  });

  if (existing) {
    throw new Error('Email already registered');
  }

  const created = await prisma.user.create({
    data: {
      username: input.email,
      email: input.email,
      password: hashPassword(input.password),
      role: input.role,
      displayName: input.name,
      designation: input.designation,
    },
  });

  return serializeUser(created);
}

export async function createStaffUsersBatch(inputs: StaffCreateInput[]) {
  const existingUsers = await prisma.user.findMany({
    where: {
      OR: inputs.flatMap((input) => [
        { email: input.email },
        { username: input.email },
      ]),
    },
    select: {
      email: true,
      username: true,
    },
  });

  const existingEmails = new Set(
    existingUsers.flatMap((user) => [user.email, user.username]).filter((value): value is string => Boolean(value))
  );
  const seenEmails = new Set<string>();
  const createdUsers: SerializedUser[] = [];
  const errors: Array<{ row: number; email: string; message: string }> = [];

  for (const [index, input] of inputs.entries()) {
    if (seenEmails.has(input.email)) {
      errors.push({
        row: index + 1,
        email: input.email,
        message: 'Email duplicated in this import',
      });
      continue;
    }

    seenEmails.add(input.email);

    if (existingEmails.has(input.email)) {
      errors.push({
        row: index + 1,
        email: input.email,
        message: 'Email already registered',
      });
      continue;
    }

    const created = await prisma.user.create({
      data: {
        username: input.email,
        email: input.email,
        password: hashPassword(input.password),
        role: input.role,
        displayName: input.name,
        designation: input.designation,
      },
    });

    createdUsers.push(serializeUser(created));
    existingEmails.add(input.email);
  }

  return {
    createdUsers,
    errors,
  };
}

export async function changePassword({ userId, currentPassword, newPassword }: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !verifyPassword(currentPassword, user.password)) {
    throw new Error('Current password is incorrect');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashPassword(newPassword),
    },
  });

  return {
    message: 'Password updated successfully.',
  };
}
