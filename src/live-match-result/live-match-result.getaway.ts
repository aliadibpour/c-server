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
  private liveData: any; 

  constructor(private readonly liveMatchResult: LiveMatchResultService) {}

  async onModuleInit() {
    this.liveData = await this.liveMatchResult.liveResult();
    console.log('Live Data Initialized:', this.liveData);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    client.on('live-match', (day, callback) => {
      console.log(day);
      try {
        callback({matchList: this.liveData[+day]})
      } catch (error) {
        console.log(error)
      }
      //client.emit('live-match-list', { matchList: this.liveData[3] });
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
