import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { MatchesService } from "../matches/matches.service";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/chat",
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwt: JwtService,
    private matches: MatchesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers.authorization?.replace("Bearer ", "") as string | undefined);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwt.verify<{ sub: string }>(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage("join_match")
  async joinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const userId = client.data.userId as string;
    await this.matches.getMessages(userId, data.matchId);
    await client.join(`match:${data.matchId}`);
    return { ok: true };
  }

  @SubscribeMessage("send_message")
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; body: string },
  ) {
    const userId = client.data.userId as string;
    const message = await this.matches.sendMessage(userId, data.matchId, data.body);
    this.server.to(`match:${data.matchId}`).emit("new_message", message);
    return message;
  }
}
