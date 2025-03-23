import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('phoneNumber') phoneNumber: string) {
    console.log(phoneNumber)
    return this.authService.loginUser(phoneNumber);
  }

  @Post('verify')
  async verifyCode(@Body('code') code: string) {
    return this.authService.verifyCode(code);
  }
}
