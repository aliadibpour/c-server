import { Module } from '@nestjs/common';
import { LiveMatchResultService } from './live-match-result.service';
import { LiveMatchResultController } from './live-match-result.controller';
import { LiveMatchGateway } from './live-match-result.getaway';

@Module({
  controllers: [LiveMatchResultController],
  providers: [LiveMatchResultService, LiveMatchGateway],
})
export class LiveMatchResultModule {}
