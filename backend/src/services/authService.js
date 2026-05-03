import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../middleware/errorHandler.js';

export const registerUser = async (email, password, name) => {
  // Reject if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  // Hash password before storing — NEVER store plaintext
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, createdAt: true }, // Never return password
  });

  return { user, token: signToken({ userId: user.id }) };
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    token: signToken({ userId: user.id }),
  };
};

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};