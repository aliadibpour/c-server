import { Injectable } from '@nestjs/common';
import { getTdjson } from 'prebuilt-tdlib';
import * as tdl from "tdl";

tdl.configure({ tdjson: getTdjson() });
@Injectable()
export class AuthService {
  private client = tdl.createClient({
    apiId: 19661737,
    apiHash: "28b0dd4e86b027fd9a2905d6c343c6bb",
  });

  private resolveAuthCode: ((code: string) => void) | null = null;

  async loginUser(phoneNumber: string) {
    return this.client.login(() => ({
      getPhoneNumber: () => {
        console.log(`📲 ارسال شماره: ${phoneNumber}`);
        return Promise.resolve(phoneNumber);
      },
      getAuthCode: () => {
        return new Promise<string>((resolve) => {
          console.log("⏳ منتظر دریافت کد تایید...");
          this.resolveAuthCode = resolve;
        });
      },
    }));
  }

  async verifyCode(code: string) {
    if (this.resolveAuthCode) {
      console.log(`🔑 کد تایید دریافتی: ${code}`);
      this.resolveAuthCode(code);
      this.resolveAuthCode = null; // پاک کردن مقدار برای جلوگیری از مشکلات احتمالی
      return { message: "✅ کد تایید ارسال شد!" };
    } else {
      throw new Error("⚠️ هنوز نیازی به وارد کردن کد تایید نیست.");
    }
  }
}
