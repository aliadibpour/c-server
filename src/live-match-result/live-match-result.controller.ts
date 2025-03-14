import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LiveMatchResultService } from './live-match-result.service';
import { LiveMatchGateway } from './live-match-result.getaway';

@Controller('live-match-result')
export class LiveMatchResultController {
  constructor(
    private readonly liveMatchResultService: LiveMatchResultService,
    private readonly liveMatchGetaway: LiveMatchGateway
  ) {}
  @Get()
  async findAll() {
    const liveData = await this.liveMatchResultService.liveMatch();
    return liveData;
  }
}
