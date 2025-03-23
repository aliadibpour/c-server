import { Injectable } from '@nestjs/common';
import { StringSession } from 'telegram/sessions';
import { Api, TelegramClient } from 'telegram';

@Injectable()
export class AuthService {
  private client: TelegramClient;
  private session: StringSession;
  private phoneNumber: string;

  constructor() {
    this.session = new StringSession(''); // اگر قبلاً لاگین شده باشد، مقدار سشن ذخیره می‌شود

    this.client = new TelegramClient(
      this.session,
      19661737,
      '28b0dd4e86b027fd9a2905d6c343c6bb',
      {
        connectionRetries: 5,
      },
    );
  }

  async startClient() {
    if (!this.client.connected) {
      await this.client.connect();
    }
  }

  async loginUser(phoneNumber: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.startClient();
        this.phoneNumber = phoneNumber;

        await this.client.invoke(new Api.auth.SendCode({
          phoneNumber: phoneNumber,
          settings: new Api.CodeSettings({
            allowFlashcall: false,
            currentNumber: true,
            allowAppHash: true
          })
        }));

        resolve('کد تأیید ارسال شد!');
      } catch (error) {
        console.error('❌ Error during login:', error);
        reject('مشکلی در ورود رخ داد.');
      }
    });
  }

  async verifyCode(code: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.startClient();

        if (!this.phoneNumber) {
          return reject('ابتدا باید شماره تلفن را ارسال کنید.');
        }

        const sentCode = await this.client.invoke(new Api.auth.SendCode({
          phoneNumber: this.phoneNumber,
          settings: new Api.CodeSettings({
            allowFlashcall: false,
            currentNumber: true,
            allowAppHash: true
          })
        }));

        if ('phoneCodeHash' in sentCode) {
          await this.client.invoke(new Api.auth.SignIn({
            phoneNumber: this.phoneNumber,
            phoneCode: code,
            phoneCodeHash: sentCode.phoneCodeHash
          }));

          resolve('✅ ورود موفقیت‌آمیز!');
        } else {
          reject('خطا در دریافت کد تأیید');
        }
      } catch (error) {
        console.error('❌ Error during verification:', error);
        reject('کد وارد شده صحیح نیست.');
      }
    });
  }
}
