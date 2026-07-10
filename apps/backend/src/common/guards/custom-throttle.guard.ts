import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_THROTTLE_KEY } from '../decorators/skip-throttle.decorator';

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

function checkLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

@Injectable()
export class CustomThrottleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>(SKIP_THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const path = req.path;
    const userId = (req as Request & { user?: { sub?: string } }).user?.sub ?? req.ip ?? 'anon';

    const isAgent = path.includes('/agent/') || path.endsWith('/conversations/query');
    const isHealth = path.includes('/health');
    const limit = isHealth ? Number.MAX_SAFE_INTEGER : isAgent ? 30 : 100;
    const windowMs = 60_000;
    const key = `${userId}:${isAgent ? 'agent' : 'read'}:${Math.floor(Date.now() / windowMs)}`;

    if (!checkLimit(key, limit, windowMs)) {
      throw new HttpException(
        { message: 'Rate limit exceeded', errorCode: 'RATE_LIMITED' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
