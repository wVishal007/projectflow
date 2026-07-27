import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AuthError } from '../../errors/AuthError';
import { ConflictError } from '../../errors/ConflictError';
import { NotFoundError } from '../../errors/NotFoundError';
import { RegisterInput, LoginInput } from './auth.schema';
import { TokenPair } from '../../types';

export class AuthService {
  async register(input: RegisterInput): Promise<TokenPair & { user: { id: string; name: string; email: string } }> {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });

    const tokens = this.generateTokens(user.id, user.email);

    return { ...tokens, user };
  }

  async login(input: LoginInput): Promise<TokenPair & { user: { id: string; name: string; email: string } }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const isValidPassword = await comparePassword(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AuthError('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async refresh(refreshTokenStr: string): Promise<TokenPair> {
    try {
      const payload = verifyRefreshToken(refreshTokenStr);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new AuthError('User not found');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new AuthError('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  private generateTokens(userId: string, email: string): TokenPair {
    return {
      accessToken: generateAccessToken({ userId, email }),
      refreshToken: generateRefreshToken({ userId, tokenVersion: 0 }),
    };
  }
}

export const authService = new AuthService();
