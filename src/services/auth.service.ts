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
