import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('phoneNumber') phoneNumber: string) {
    console.log(`request code for: ${phoneNumber}`);
    return this.authService.loginUser(phoneNumber);
  }

  @Post('verify')
  async verify(@Body() body: { phoneNumber: string; code: string }) {
    console.log(`request code for:${body.phoneNumber} with code:${body.code}`);
    
    if (!body.phoneNumber || !body.code) {
      console.error("bad request");
      throw new Error("bad request");
    }

    return this.authService.verifyCode(body.phoneNumber, body.code);
  }
}
//09132541719 mansor
//09138493082 hossein
//09134741096 heydar
//09137230227 ali