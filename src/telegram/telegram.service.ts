import { Injectable } from '@nestjs/common';
import * as tdl from 'tdl';
import { getTdjson } from 'prebuilt-tdlib';
import * as fs from 'fs';
import * as path from 'path';

tdl.configure({ tdjson: getTdjson() });

@Injectable()
export class TelegramService {
  private getClientByPhone(phoneNumber: string) {
    const sessionPath = path.join(__dirname, '..', '..', 'sessions', `+${phoneNumber}`);

    if (!fs.existsSync(sessionPath)) {
      throw new Error(`No session found for phone number ${phoneNumber}`);
    }

    const client = tdl.createClient({
      apiId: 19661737, // جایگزین با مقادیر واقعی
      apiHash: '28b0dd4e86b027fd9a2905d6c343c6bb', // جایگزین با مقادیر واقعی
      databaseDirectory: path.join(__dirname, '..', '..', 'sessions', phoneNumber),
      filesDirectory: path.join(__dirname, '..', '..', 'sessions', phoneNumber, 'files'),
      useTestDc: false,
      //verbosityLevel: 1,
    });

    return client;
  }

  async sendMessage(phoneNumber: string, chatId: number, text: string) {
    const client = this.getClientByPhone(phoneNumber);
    return client.invoke({
      '@type': 'sendMessage',
      chat_id: chatId,
      input_message_content: {
        '@type': 'inputMessageText',
        text: { '@type': 'formattedText', text },
      },
    });
  }

  async replyToMessage(phoneNumber: string, chatId: number, messageId: number, text: string) {
    const client = this.getClientByPhone(phoneNumber);
    return client.invoke({
      '@type': 'sendMessage',
      chat_id: chatId,
      reply_to_message_id: messageId,
      input_message_content: {
        '@type': 'inputMessageText',
        text: { '@type': 'formattedText', text },
      },
    });
  }

  async forwardMessage(phoneNumber: string, fromChatId: number, toChatId: number, messageId: number) {
    const client = this.getClientByPhone(phoneNumber);
    return client.invoke({
      '@type': 'forwardMessages',
      from_chat_id: fromChatId,
      chat_id: toChatId,
      message_ids: [messageId],
      options: {
        disable_notification: false,
        from_background: false,
      },
    });
  }

  async getChat(phoneNumber: string, chatId: number) {
    const client = this.getClientByPhone(phoneNumber);
    return client.invoke({
      '@type': 'getChat',
      chat_id: chatId,
    });
  }

  async getLastMessages(phoneNumber: string, chatId: number, count: number = 15) {
    const client = this.getClientByPhone(phoneNumber);
    const res = await client.invoke({
      '@type': 'getChatHistory',
      chat_id: chatId,
      from_message_id: 0,
      offset: 0,
      limit: count,
      only_local: false,
    });

    return res.messages;
  }

  async deleteMessage(phoneNumber: string, chatId: number, messageId: number) {
    const client = this.getClientByPhone(phoneNumber);
    return client.invoke({
      '@type': 'deleteMessages',
      chat_id: chatId,
      message_ids: [messageId],
      revoke: true,
    });
  }
}
