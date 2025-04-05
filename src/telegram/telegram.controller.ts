// telegram.controller.ts
import { Body, Controller, Post } from '@nestjs/common'
import { TelegramService } from './telegram.service'

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('send')
  async send(@Body() body: { chatId: number; text: string }) {
    return await this.telegramService.sendMessage(body.chatId, body.text)
  }

  @Post('reply')
  async reply(@Body() body: { chatId: number; messageId: number; text: string }) {
    return await this.telegramService.replyToMessage(body.chatId, body.messageId, body.text)
  }

  @Post('forward')
  async forward(@Body() body: { fromChatId: number; toChatId: number; messageId: number }) {
    return await this.telegramService.forwardMessage(body.fromChatId, body.toChatId, body.messageId)
  }

  @Post('get-chat')
  async getChat(@Body() body: { chatId: number }) {
    return await this.telegramService.getChat(body.chatId)
  }

  @Post('get-messages')
  async getMessages(@Body() body: { chatId: number; limit?: number }) {
    return await this.telegramService.getLastMessages(body.chatId, body.limit || 15)
  }

  @Post('delete-message')
  async deleteMessage(@Body() body: { chatId: number; messageId: number }) {
    return await this.telegramService.deleteMessage(body.chatId, body.messageId)
  }
}
