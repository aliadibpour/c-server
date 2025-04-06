import { Injectable } from '@nestjs/common';
import * as tdl from 'tdl';
import { getTdjson } from 'prebuilt-tdlib';
import * as fs from 'fs';
import * as path from 'path';

tdl.configure({ tdjson: getTdjson() });

@Injectable()
export class TelegramService {
  private clients = new Map<string, { client: any; timeout: NodeJS.Timeout }>();

private getClientByPhone(phoneNumber: string) {
  const existing = this.clients.get(phoneNumber);
  if (existing) {
    // reset timer fo active clients
    clearTimeout(existing.timeout);
    existing.timeout = this.createAutoCloseTimer(phoneNumber, existing.client);
    return existing.client;
  }

  const sessionPath = path.join(__dirname, '..', '..', 'sessions', `+${phoneNumber}`);

  if (!fs.existsSync(sessionPath)) {
    throw new Error(`No session found for phone number ${phoneNumber}`);
  }

  const client = tdl.createClient({
    apiId: 94575,
    apiHash: 'a3406de8d171bb422bbec5e2e116196e',
    databaseDirectory: path.join(__dirname, '..', '..', 'sessions', phoneNumber),
    filesDirectory: path.join(__dirname, '..', '..', 'sessions', phoneNumber, 'files'),
    useTestDc: false,
    //verbosityLevel: 1,
  });

  const timeout = this.createAutoCloseTimer(phoneNumber, client);

  client.on('close', () => {
    console.log(`Client closed for ${phoneNumber}`);
    this.removeClient(phoneNumber);
  });

  this.clients.set(phoneNumber, { client, timeout });

  return client;
}

private createAutoCloseTimer(phoneNumber: string, client: any) {
  return setTimeout(() => {
    console.log(`Auto closing client for ${phoneNumber} due to inactivity`);
    client.close();
    // remove from cashe after close client
    this.removeClient(phoneNumber);
  }, 10 * 60 * 1000); // 10m
}

private removeClient(phoneNumber: string) {
  const entry = this.clients.get(phoneNumber);
  if (entry) {
    clearTimeout(entry.timeout);
    this.clients.delete(phoneNumber);
  }
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
      revoke: true, //means delete for everyone
    });
  }
}
