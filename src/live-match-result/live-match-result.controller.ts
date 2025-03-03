import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LiveMatchResultService } from './live-match-result.service';

@Controller('live-match-result')
export class LiveMatchResultController {
  constructor(private readonly liveMatchResultService: LiveMatchResultService) {}
  @Get()
  findAll() {
    return this.liveMatchResultService.liveResult();
  }

}
