import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common'
import { TelegramService } from './telegram.service'
import { JwtLoginGuard } from 'src/common/guard/login.guard';

@UseGuards(JwtLoginGuard)
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('send')
  async send(@Body() body: { chatId: number; text: string }, @Req() req) {
    return await this.telegramService.sendMessage(
      req.user.phoneNumber,
      body.chatId,
      body.text,
    )
  }

  @Post('reply')
  async reply(@Body() body: { chatId: number; messageId: number; text: string }, @Req() req) {
    return await this.telegramService.replyToMessage(
      req.user.phoneNumber,
      body.chatId,
      body.messageId,
      body.text,
    )
  }

  @Post('forward')
  async forward(@Body() body: { fromChatId: number; toChatId: number; messageId: number }, @Req() req) {
    return await this.telegramService.forwardMessage(
      req.user.phoneNumber,
      body.fromChatId,
      body.toChatId,
      body.messageId,
    )
  }

  @Post('get-chat')
  async getChat(@Body() body: { chatId: number }, @Req() req) {
    return await this.telegramService.getChat(
      req.user.phoneNumber,
      body.chatId,
    )
  }

  @Post('get-messages')
  async getMessages(@Body() body: { chatId: number; limit?: number }, @Req() req) {
    return await this.telegramService.getLastMessages(
      req.user.phoneNumber,
      body.chatId,
      body.limit || 15,
    )
  }

  @Post('delete-message')
  async deleteMessage(@Body() body: { chatId: number; messageId: number }, @Req() req) {
    return await this.telegramService.deleteMessage(
      req.user.phoneNumber,
      body.chatId,
      body.messageId,
    )
  }
}
