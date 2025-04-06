// common/jwt/jwt.service.ts
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtService {
  constructor(private configService: ConfigService) {}

  generateToken(payload: any): string {
    const secret = this.configService.get<string>("JWT_SECRET_KEY");
    return jwt.sign(payload, secret);
  }

  verifyToken(token: string): any {
    const secret = this.configService.get<string>("JWT_SECRET_KEY");
    return jwt.verify(token, secret);
  }
}
