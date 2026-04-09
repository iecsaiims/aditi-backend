import { prisma } from '../config/prisma';

type LoginInput = {
  username: string;
  password: string;
  role: string;
};

export async function loginUser({ username, password, role }: LoginInput) {
  let user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username,
        password,
        role,
        displayName: 'Operator'
      }
    });
  } else if (user.role !== role) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role }
    });
  }

  if (user.password !== password) {
    throw new Error('Invalid username or password');
  }

  return {
    token: 'demo-token-for-first-integration',
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName
    }
  };
}
