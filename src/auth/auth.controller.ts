import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('phoneNumber') phoneNumber: string) {
    console.log(`📞 درخواست ورود برای شماره: ${phoneNumber}`);
    return this.authService.loginUser(phoneNumber);
  }

  @Post('verify')
  async verify(@Body() body: { phoneNumber: string; code: string }) {
    console.log(`📢 درخواست تأیید کد برای ${body.phoneNumber} با کد ${body.code}`);
    
    if (!body.phoneNumber || !body.code) {
      console.error("⚠️ شماره تلفن یا کد تایید دریافت نشد.");
      throw new Error("⚠️ شماره تلفن یا کد تایید ارسال نشده است.");
    }

    return this.authService.verifyCode(body.phoneNumber, body.code);
  }
}
