import { Injectable } from '@nestjs/common';
import client from './telegramClient';
import * as tdl from 'tdl';
import { getTdjson } from 'prebuilt-tdlib';

tdl.configure({ tdjson: getTdjson() });

@Injectable()
export class TelegramService {
  async sendMessage(chatId: number, text: string) {
    return client.invoke({
      '@type': 'sendMessage',
      chat_id: chatId,
      input_message_content: {
        '@type': 'inputMessageText',
        text: { '@type': 'formattedText', text },
      },
    })
  }

  async replyToMessage(chatId: number, messageId: number, text: string) {
    return client.invoke({
      '@type': 'sendMessage',
      chat_id: chatId,
      reply_to_message_id: messageId,
      input_message_content: {
        '@type': 'inputMessageText',
        text: { '@type': 'formattedText', text },
      },
    })
  }

  async forwardMessage(fromChatId: number, toChatId: number, messageId: number) {
    return client.invoke({
      '@type': 'forwardMessages',
      from_chat_id: fromChatId,
      chat_id: toChatId,
      message_ids: [messageId],
      options: {
        disable_notification: false,
        from_background: false,
      },
    })
  }

  async getChat(chatId: number) {
    return client.invoke({
      '@type': 'getChat',
      chat_id: chatId,
    })
  }

  async getLastMessages(chatId: number, count: number = 15) {
    const res = await client.invoke({
      '@type': 'getChatHistory',
      chat_id: chatId,
      from_message_id: 0,
      offset: 0,
      limit: count,
      only_local: false,
    })

    return res.messages
  }

  async deleteMessage(chatId: number, messageId: number) {
    return client.invoke({
      '@type': 'deleteMessages',
      chat_id: chatId,
      message_ids: [messageId],
      revoke: true, // true یعنی برای همه حذف شه
    })
  }
}
