import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  RELATIONSHIP_MANAGER: 'Relationship Manager',
  SUPERVISOR: 'Supervisor',
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found');
    }
    return {
      sub: user.id,
      email: user.email,
      role: ROLE_LABELS[user.role],
      name: `${user.firstName} ${user.lastName}`,
    };
  }
}
