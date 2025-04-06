import { Controller, Post, Body } from '@nestjs/common';
import { JwtService } from 'src/common/jwt/jwt.service';

@Controller('user')
export class UserController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('generate-token')
  generateJwt(@Body() body: {
    phone: string; //if is null its the guest user
    team1: string;
    team2: string | null;
    team3: string | null;
  }) {
    const payload = {
      phone: body.phone,
      team1: body.team1,
      team2: body.team2,
      team3: body.team3,
      registered: !!body.phone,
    };

    const token = this.jwtService.generateToken(payload);
    return { token };
  }
}
