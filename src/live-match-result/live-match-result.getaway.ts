import { 
  SubscribeMessage, 
  WebSocketGateway, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  MessageBody, 
  ConnectedSocket 
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LiveMatchResultService } from './live-match-result.service';

@WebSocketGateway({ cors: true })
export class LiveMatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private dataArray = ['Apple', 'Banana', 'Orange', 'Grapes', 'Mango'];
  private liveData: any; 

  constructor(private readonly liveMatchResult: LiveMatchResultService) {}

  async onModuleInit() {
    // This runs **once** when the WebSocket gateway is initialized
    this.liveData = await this.liveMatchResult.liveResult();
    console.log('Live Data Initialized:', this.liveData);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Send the stored liveData to the client
    client.on('send_index', (data: { index: number }) => {
      const { index } = data;
      const response = this.dataArray[index] || 'Invalid index';
      client.emit('receive_data', { index, value: this.liveData });
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
