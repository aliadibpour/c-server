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
    private readonly configService: ConfigService,
  ) {}

  private API_ID = this.configService.get<number>('API_ID');
  private API_HASH = this.configService.get<string>('API_HASH');

  private authResolvers: Map<string, (code: string) => void> = new Map();
  private clients: Map<string, any> = new Map();
  private attemptCounts: Map<string, number> = new Map();

  private getSessionPath(phone: string, type: 'active' | 'pending') {
    return path.resolve('sessions', type, phone);
  }

  private sessionExists(phone: string, type: 'active' | 'pending') {
    return fs.existsSync(this.getSessionPath(phone, type));
  }

  private async getClient(phone: string, type: 'active' | 'pending') {
    if (this.clients.has(phone)) return this.clients.get(phone);

    const dir = this.getSessionPath(phone, type);
    fs.mkdirSync(dir, { recursive: true });

    const client = tdl.createClient({
      apiId: this.API_ID,
      apiHash: this.API_HASH,
      databaseDirectory: dir,
      filesDirectory: dir,
    });

    this.clients.set(phone, client);
    return client;
  }

  async loginUser(phone: string) {
    if (this.sessionExists(phone, 'pending')) {
      return { message: 'Verification already sent. Awaiting code.' };
    }
  
    const attempts = this.attemptCounts.get(phone) || 0;
    if (attempts >= 5) {
      return { error: 'Too many attempts. Try later.' };
    }
    this.attemptCounts.set(phone, attempts + 1);
  
    const client = await this.getClient(phone, 'pending');
  
    let codeType: string | null = null;
  
    const getCodeType = new Promise<string>((resolve) => {
      client.on('update', (update) => {
        if (
          update._ === 'updateAuthorizationState' &&
          update.authorization_state._ === 'authorizationStateWaitCode'
        ) {
          const codeInfo = update.authorization_state.code_info;
          if (codeInfo && codeInfo.type && codeInfo.type._) {
            const method = codeInfo.type._; // مثل authenticationCodeTypeSms
            console.log('🔐 نوع ارسال کد:', method);
            codeType = method;
            resolve(method);
          }
        }
      });
    });
  
    client
      .login(() => ({
        getPhoneNumber: () => Promise.resolve(phone),
        getAuthCode: () =>
          new Promise((resolve) => {
            this.authResolvers.set(phone, resolve);
          }),
      }))
      .then(() => {
        this.authResolvers.delete(phone);
        this.attemptCounts.delete(phone);
      })
      .catch((err) => {
        console.error('Login error:', err.message);
        this.cleanupSession(phone);
      });
  
    // منتظر بمان تا نوع کد مشخص شود یا Timeout بزنیم
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('unknown'), 5000);
    });
  
    const method = await Promise.race([getCodeType, timeoutPromise]);
  
    return {
      message: 'Verification code sent.',
      method: method.replace('authenticationCodeType', '').toLowerCase(), // برای خوانایی بهتر
    };
  }
  

  async verifyCode(phone: string, code: string) {
    const client = this.clients.get(phone);
    if (!client) return { error: 404, message: 'Client not found' };
  
    this.authResolvers.get(phone)?.(code);
  
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.off('update', onUpdate); // remove listener
        reject({ error: 408, message: 'Login timeout.' });
      }, 10000); // 10 ثانیه
  
      const onUpdate = async (update) => {
        if (
          update._ === 'updateAuthorizationState' &&
          update.authorization_state._ === 'authorizationStateReady'
        ) {
          clearTimeout(timeout);
          client.off('update', onUpdate); // حذف لیسنر
          await client.close();
          this.clients.delete(phone);
          this.authResolvers.delete(phone);
          await this.moveSessionToActive(phone);
          await this.userService.registerUser(phone);
          resolve({ message: 'Login successful.' });
        }
  
        if (
          update._ === 'updateAuthorizationState' &&
          update.authorization_state._ === 'authorizationStateWaitCode'
        ) {
          // اگر باز هم منتظر کد شد، یعنی کد اشتباه بوده
          clearTimeout(timeout);
          client.off('update', onUpdate);
          reject({ error: 401, message: 'Code incorrect or expired.' });
        }
      };
  
      client.on('update', onUpdate);
    });
  }
  
  async cancelSession(phone: string) {
    this.cleanupSession(phone);
    return { message: 'Session canceled by user.' };
  }

  private cleanupSession(phone: string) {
    const pathToDelete = this.getSessionPath(phone, 'pending');
    if (fs.existsSync(pathToDelete)) {
      fs.rmSync(pathToDelete, { recursive: true, force: true });
      console.log(`Pending session deleted: ${phone}`);
    }
    this.clients.delete(phone);
    this.authResolvers.delete(phone);
  }

  private async moveSessionToActive(phone: string) {
    const from = this.getSessionPath(phone, 'pending');
    const to = this.getSessionPath(phone, 'active');
    const toDir = path.dirname(to);

    if (!fs.existsSync(from)) return;

    if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });
    if (fs.existsSync(to)) fs.rmSync(to, { recursive: true, force: true });

    fs.renameSync(from, to);
    console.log(`Session moved to active: ${phone}`);
  }
}
