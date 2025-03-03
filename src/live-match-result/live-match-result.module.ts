import { Module } from '@nestjs/common';
import { LiveMatchResultService } from './live-match-result.service';
import { LiveMatchResultController } from './live-match-result.controller';

@Module({
  controllers: [LiveMatchResultController],
  providers: [LiveMatchResultService],
})
export class LiveMatchResultModule {}
