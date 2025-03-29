import { Injectable } from '@nestjs/common';
import { getTdjson } from 'prebuilt-tdlib';
import * as tdl from 'tdl';
import * as path from 'path';
import * as fs from 'fs';
import { UserService } from 'src/user/user.service';

tdl.configure({ tdjson: getTdjson() });

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  private authResolvers: Map<string, (code: string) => void> = new Map();
  private clients: Map<string, any> = new Map();
  private attemptCounts: Map<string, number> = new Map(); // Rate-limiting attempts

  private getSessionPath(phoneNumber: string) {
    return path.resolve('sessions', phoneNumber);
  }

  private sessionExists(phoneNumber: string): boolean {
    return fs.existsSync(this.getSessionPath(phoneNumber));
  }

  private async getClient(phoneNumber: string) {
    if (this.clients.has(phoneNumber)) {
      return this.clients.get(phoneNumber);
    }

    const sessionPath = this.getSessionPath(phoneNumber);
    if (!this.sessionExists(phoneNumber)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

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
    // Check if user is already logged in (session exists)
    if (this.sessionExists(phoneNumber)) {
      return { message: 'User is already logged in.' };
    }

    let attempts = this.attemptCounts.get(phoneNumber) || 0;
    const MAX_ATTEMPTS = 5;

    // Prevent too many login attempts
    if (attempts >= MAX_ATTEMPTS) {
      return { error: 'Too many login attempts. Please try again later.' };
    }

    this.attemptCounts.set(phoneNumber, attempts + 1);

    const client = await this.getClient(phoneNumber);
    client.login(() => ({
      getPhoneNumber: () => {
        console.log(`📲 Sending phone number: ${phoneNumber}`);
        return Promise.resolve(phoneNumber);
      },
      getAuthCode: () => {
        return new Promise<string>((resolve) => {
          console.log(`⏳ Waiting for verification code for ${phoneNumber}...`);
          this.authResolvers.set(phoneNumber, resolve);
        });
      },
    }))
    .then(() => {
      console.log(`✅ Login completed for ${phoneNumber}`);
    })
    .catch((err) => {
      console.error(`❌ Login failed for ${phoneNumber}:`, err);
      this.cleanupSession(phoneNumber);
    });

    return { message: 'Verification code sent. Please enter the code.' };
  }

  async verifyCode(phoneNumber: string, code: string) {
    // Check if a login attempt is pending
    if (!this.authResolvers.has(phoneNumber)) {
      return { error: 500, message: 'No pending login request or invalid code.' };
    }

    console.log(`🔑 Verifying code for ${phoneNumber}: ${code}`);

    return new Promise((resolve, reject) => {
      // Resolve the verification code
      this.authResolvers.get(phoneNumber)!(code);

      // Delay added to simulate login completion
      setTimeout(() => {
        const client = this.clients.get(phoneNumber);

        // Check if the client is authorized after the delay
        if (!client.authorized) {
          console.error(`❌ Invalid verification code for ${phoneNumber}, deleting session.`);
          this.cleanupSession(phoneNumber);
          return reject({ error: 401, message: 'Invalid verification code. Please try again.' });
        }

        console.log(`✅ Login completed for ${phoneNumber}`);
        this.authResolvers.delete(phoneNumber);

        // Reset attempts on successful login
        this.attemptCounts.delete(phoneNumber);

        // Register user and return success response
        resolve({ message: 'Login successful!', user: this.userService.registerUser(phoneNumber) });
      }, 3000); // Delay for checking login completion
    });
  }

  private cleanupSession(phoneNumber: string) {
    const sessionPath = this.getSessionPath(phoneNumber);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(`🗑️ Removed incomplete session for ${phoneNumber}`);
    }
    this.clients.delete(phoneNumber);
  }
}
