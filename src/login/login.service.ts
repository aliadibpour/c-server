import { Injectable } from '@nestjs/common';
import { getTdjson } from 'prebuilt-tdlib';
import * as tdl from 'tdl';
import * as path from 'path';
import * as fs from 'fs';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';

tdl.configure({ tdjson: getTdjson() });

@Injectable()
export class LoginService {
  constructor(
    private readonly userService: UserService,
    private configService: ConfigService
  ) {}

  private API_ID = this.configService.get<number>('API_ID');
  private API_HASH = this.configService.get<string>('API_HASH');

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
      apiId: this.API_ID,
      apiHash: this.API_HASH,
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
    this.authResolvers.get(phoneNumber)?.(code);
  
    const client = this.clients.get(phoneNumber);
    if (!client) return { error: 500, message: 'Client not found.' };
  
    return new Promise((resolve, reject) => {
      let tries = 0;
      const maxTries = 15;
  
      const interval = setInterval(async () => {
        tries++;
  
        try {
          const state = await client.invoke({ _: 'getAuthorizationState' });
  
          if (state?._ === 'authorizationStateReady') {
            clearInterval(interval);

            try {
              await client.close(); // ✅ بستن کلاینت
              this.clients.delete(phoneNumber);

              this.moveSessionToActive(phoneNumber); // ✅ انتقال امن سشن
            } catch (err) {
              console.error(`❌ Move session failed: ${err.message}`);
              return reject({
                error: 500,
                message: 'Failed to move session',
                details: err.message,
              });
            }

            await this.userService.registerUser(phoneNumber);
            return resolve({ message: 'Login successful!' });
          }
  
          if (
            ['authorizationStateWaitPhoneNumber', 'authorizationStateWaitCode'].includes(state?._) &&
            tries >= maxTries
          ) {
            clearInterval(interval);
            return reject({ error: 401, message: 'Invalid verification code or timeout.' });
          }
  
          if (tries >= maxTries) {
            clearInterval(interval);
            return reject({ error: 401, message: 'Login timeout. Please try again.' });
          }
        } catch (err) {
          clearInterval(interval);
          return reject({
            error: 500,
            message: 'TDLib error while checking authorization state.',
            details: err.message,
          });
        }
      }, 700);
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

  private async moveSessionToActive(phoneNumber: string) {
    const pendingPath = this.getSessionPath(phoneNumber, 'pending');
    const activePath = this.getSessionPath(phoneNumber, 'active');
    const activeDir = path.dirname(activePath);
  
    if (!fs.existsSync(pendingPath)) {
      console.warn(`⚠️ Pending session not found for ${phoneNumber}`);
      return;
    }
  
    // اگر active وجود نداشت، بساز
    if (!fs.existsSync(activeDir)) {
      fs.mkdirSync(activeDir, { recursive: true });
    }
  
    // کلاینت رو ببند (اگه وجود داره)
    const client = this.clients.get(phoneNumber);
    if (client) {
      await client.close(); // صبر می‌کنیم تا بسته بشه
      this.clients.delete(phoneNumber);
    }
  
    // صبر برای اینکه tdlib فایل‌ها رو کامل بنویسه
    await new Promise((res) => setTimeout(res, 1000));
  
    // اگه فولدر active از قبل بود، حذفش کن
    if (fs.existsSync(activePath)) {
      fs.rmSync(activePath, { recursive: true, force: true });
    }
  
    // حالا فولدر رو منتقل کن
    fs.renameSync(pendingPath, activePath);
    console.log(`✅ Moved session from pending to active for ${phoneNumber}`);
  }
  
}