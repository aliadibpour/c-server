import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { LoginService } from './login.service';

@Controller('auth')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post('login')
  async login(@Body('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required.');
    }
    return this.loginService.loginUser(phoneNumber);
  }

  @Post('verify')
  async verify(@Body() body: { phoneNumber: string; code: string }) {
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      throw new BadRequestException('Phone number and code are required.');
    }

    try {
      return await this.loginService.verifyCode(phoneNumber, code);
    } catch (error) {
      console.error(`Verification failed for ${phoneNumber}:`, error);
      throw new BadRequestException(error.message || 'Verification failed.');
    }
  }

  @Post('cancel-session')
  async cancelSession(@Body('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required.');
    }

    return this.loginService.cancelSession(phoneNumber);
  }
}
