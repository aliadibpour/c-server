import { Injectable } from '@nestjs/common';
import { getTdjson } from 'prebuilt-tdlib';
import * as tdl from 'tdl';
import * as path from 'path';
import * as fs from 'fs';
import { UserService } from 'src/user/user.service';

tdl.configure({ tdjson: getTdjson() });

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService) {}

  private authResolvers: Map<string, (code: string) => void> = new Map();
  private clients: Map<string, any> = new Map();
  private attemptCounts: Map<string, number> = new Map();

  private getSessionPath(phoneNumber: string, type: 'active' | 'pending') {
    return path.resolve('sessions', type, phoneNumber);
  }

  private sessionExists(phoneNumber: string, type: 'active' | 'pending') {
    return fs.existsSync(this.getSessionPath(phoneNumber, type));
  }

  private async getClient(phoneNumber: string, type: 'active' | 'pending') {
    if (this.clients.has(phoneNumber)) {
      return this.clients.get(phoneNumber);
    }

    const sessionPath = this.getSessionPath(phoneNumber, type);
    fs.mkdirSync(sessionPath, { recursive: true });

    const client = tdl.createClient({
      apiId: 19661737,
      apiHash: '28b0dd4e86b027fd9a2905d6c343c6bb',
      databaseDirectory: sessionPath,
      filesDirectory: sessionPath,
    });

    this.clients.set(phoneNumber, client);
    return client;
  }

  async loginUser(phoneNumber: string) {
    if (this.sessionExists(phoneNumber, 'active')) {
      return { message: 'User is already logged in.' };
    }

    if (this.sessionExists(phoneNumber, 'pending')) {
      return { message: 'Verification code already sent. Please enter the code.' };
    }

    const attempts = this.attemptCounts.get(phoneNumber) || 0;
    if (attempts >= 5) {
      return { error: 'Too many login attempts. Please try again later.' };
    }
    this.attemptCounts.set(phoneNumber, attempts + 1);

    const client = await this.getClient(phoneNumber, 'pending');
    client
      .login(() => ({
        getPhoneNumber: () => Promise.resolve(phoneNumber),
        getAuthCode: () =>
          new Promise<string>((resolve) => {
            this.authResolvers.set(phoneNumber, resolve);
          }),
      }))
      .then(() => {
        console.log(`✅ Login completed for ${phoneNumber}`);
        this.moveSessionToActive(phoneNumber);
        this.authResolvers.delete(phoneNumber);
        this.attemptCounts.delete(phoneNumber);
      })
      .catch((err) => {
        console.error(`❌ Login failed for ${phoneNumber}`, err);
        this.cleanupSession(phoneNumber);
      });

    return { message: 'Verification code sent. Please enter the code.' };
  }

  async verifyCode(phoneNumber: string, code: string) {
    if (!this.authResolvers.has(phoneNumber)) {
      return { error: 500, message: 'No pending login request or invalid code.' };
    }

    console.log(`🔐 Verifying code for ${phoneNumber}: ${code}`);

    return new Promise((resolve, reject) => {
      this.authResolvers.get(phoneNumber)!(code);

      setTimeout(() => {
        const client = this.clients.get(phoneNumber);
        if (!client?.authorized) {
          this.cleanupSession(phoneNumber);
          return reject({ error: 401, message: 'Invalid verification code.' });
        }

        this.authResolvers.delete(phoneNumber);
        this.attemptCounts.delete(phoneNumber);

        resolve({
          message: 'Login successful!',
          user: this.userService.registerUser(phoneNumber),
        });
      }, 3000);
    });
  }

  cancelSession(phoneNumber: string) {
    this.cleanupSession(phoneNumber);
    return { message: 'Login session canceled.' };
  }

  private cleanupSession(phoneNumber: string) {
    const pendingPath = this.getSessionPath(phoneNumber, 'pending');
    if (fs.existsSync(pendingPath)) {
      fs.rmSync(pendingPath, { recursive: true, force: true });
      console.log(`🗑️ Removed pending session for ${phoneNumber}`);
    }

    this.clients.delete(phoneNumber);
    this.authResolvers.delete(phoneNumber);
  }

  private moveSessionToActive(phoneNumber: string) {
    const pendingPath = this.getSessionPath(phoneNumber, 'pending');
    const activePath = this.getSessionPath(phoneNumber, 'active');

    if (!fs.existsSync(pendingPath)) return;

    if (fs.existsSync(activePath)) {
      fs.rmSync(activePath, { recursive: true, force: true });
    }

    fs.renameSync(pendingPath, activePath);
    console.log(`📂 Moved session from pending to active for ${phoneNumber}`);
  }
}
