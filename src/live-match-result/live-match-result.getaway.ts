import { 
  SubscribeMessage, 
  WebSocketGateway, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LiveMatchResultService } from './live-match-result.service';

@WebSocketGateway({ cors: true })
export class LiveMatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private liveMatch: any; 

  constructor(private readonly liveMatchResultService: LiveMatchResultService) {}

  async onModuleInit() {
    this.liveMatch = await this.liveMatchResultService.liveMatch();
    console.log('Live Data Initialized:', this.liveMatch);

    let page = this.liveMatch[2];
    this.liveMatch[2] = await this.liveMatchResultService.evaluatePage(this.liveMatch[2], true);
    setInterval(async() => {
      await page.reload()
      await new Promise((resolve) => setTimeout(resolve, 8000));
      try {
        this.liveMatch[2] = await this.liveMatchResultService.evaluatePage(page, true);
      } catch (error) {
        console.log(error);
      }
}, 40000); 
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    client.on('live-match', (day, callback) => {
      console.log(day);
      try {
        callback({matchList: this.liveMatch[+day]})
      } catch (error) {
        console.log(error)
      }
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
