import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, AuditStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  RELATIONSHIP_MANAGER: 'Relationship Manager',
  SUPERVISOR: 'Supervisor',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Email already registered',
        errorCode: 'EMAIL_EXISTS',
      });
    }

    const [firstName, ...rest] = dto.name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email: dto.email,
        passwordHash,
        role: UserRole.RELATIONSHIP_MANAGER,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        status: AuditStatus.SUCCESS,
      },
    });

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) {
    const name = `${user.firstName} ${user.lastName}`;
    const roleLabel = ROLE_LABELS[user.role];
    const payload = { sub: user.id, email: user.email, role: roleLabel };
    return {
      success: true,
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name,
          role: roleLabel,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
