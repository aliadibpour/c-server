// common/jwt/jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JwtLoginGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    const decoded = this.jwtService.verifyToken(token);

    if (!decoded?.phoneNumber) {
      throw new UnauthorizedException('No phone number in token');
    }

    const sessionPath = path.resolve('sessions', decoded.phoneNumber);
    if (!fs.existsSync(sessionPath)) {
      throw new UnauthorizedException('Session not found');
    }

    request['phoneNumber'] = decoded.phoneNumber;
    return true;
  }
}
