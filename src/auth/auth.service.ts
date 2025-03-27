import { Injectable } from '@nestjs/common';
import { getTdjson } from 'prebuilt-tdlib';
import * as tdl from "tdl";
import * as path from "path";
import * as fs from "fs";

tdl.configure({ tdjson: getTdjson() });

@Injectable()
export class AuthService {
  private authResolvers: Map<string, (code: string) => void> = new Map();
  private clients: Map<string, any> = new Map();

  private getClient(phoneNumber: string) {
    if (this.clients.has(phoneNumber)) {
      return this.clients.get(phoneNumber);
    }

    const sessionPath = path.resolve("sessions", phoneNumber);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const client = tdl.createClient({
      apiId: 19661737,
      apiHash: "28b0dd4e86b027fd9a2905d6c343c6bb",
      databaseDirectory: sessionPath,
      filesDirectory: sessionPath,
    });

    this.clients.set(phoneNumber, client);
    return client;
  }

  async loginUser(phoneNumber: string) {
    const client = this.getClient(phoneNumber);

    return client.login(() => ({
      getPhoneNumber: () => {
        console.log(`send phoneNumber ${phoneNumber}`);
        return Promise.resolve(phoneNumber);
      },
      getAuthCode: () => {
        return new Promise<string>((resolve) => {
          console.log(`wait for sending verify code${phoneNumber}...`);
          this.authResolvers.set(phoneNumber, resolve);
        });
      },
    }));
  }

  async verifyCode(phoneNumber: string, code: string) {
    if (this.authResolvers.has(phoneNumber)) {
      console.log(`resolve code for:${phoneNumber}: ${code}`);
      this.authResolvers.get(phoneNumber)!(code);
      this.authResolvers.delete(phoneNumber);
      return { message: "login success" };
    } else {
      throw new Error("still no need to send code or the code is incorrect!");
    }
  }
}
