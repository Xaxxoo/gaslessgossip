import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { RoomMessagesService } from '../room-messages/room-messages.service';
import { RoomService } from '../rooms/rooms.service';
import { BlocksService } from '../users/blocks.service';
import { ChatsService } from './chats.service';
import { UseFilters } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private messagesService: MessagesService,
    private roomMessagesService: RoomMessagesService,
    private roomsService: RoomService,
    private blocksService: BlocksService,
    private chatsService: ChatsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      
      // Join a personal room for 1-to-1 chats
      client.join(`user_${payload.userId}`);
      console.log(`Client connected: ${client.id}, User: ${payload.userId}`);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number },
  ) {
    // Check if user is member of room
    const room = await this.roomsService.getRoomById(data.roomId);
    if (!room) throw new WsException('Room not found');
    
    // In this app, room members are tracked. 
    // We should verify membership if it's not a public room, but for now let's just join.
    client.join(`room_${data.roomId}`);
    return { event: 'joinedRoom', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number },
  ) {
    client.leave(`room_${data.roomId}`);
    return { event: 'leftRoom', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId?: number; roomId?: number; content: string; recipientId?: number },
  ) {
    const userId = client.data.user.userId;

    if (data.chatId || data.recipientId) {
      // Private Chat
      let chatId = data.chatId;
      let recipientId = data.recipientId;

      if (!chatId && recipientId) {
        const chat = await this.chatsService.hasChat(userId, recipientId);
        if (chat) {
          chatId = chat.id;
        } else {
          // Auto create chat? Maybe better to expect chatId
          throw new WsException('Chat does not exist. Please create it first.');
        }
      }

      if (chatId) {
        const chat = await this.chatsService.getChatById(chatId, userId);
        const otherUser = chat.sender.id === userId ? chat.receiver : chat.sender;
        
        // Check if blocked
        const isBlocked = await this.blocksService.isBlocked(userId, otherUser.id);
        if (isBlocked) {
          throw new WsException('You cannot send messages to this user.');
        }

        const message = await this.messagesService.sendMessage({
          chatId,
          senderId: userId,
          content: data.content,
        });

        // Emit to both
        this.server.to(`user_${userId}`).to(`user_${otherUser.id}`).emit('newMessage', {
          chatId,
          message,
        });
      }
    } else if (data.roomId) {
      // Room Message
      const room = await this.roomsService.getRoomById(data.roomId);
      if (!room) throw new WsException('Room not found');

      const message = await this.roomMessagesService.sendMessage(data.roomId, userId, data.content);

      const payload = {
        roomId: data.roomId,
        message: {
          ...message,
          sender: room.anonymous_mode ? { id: 0, username: 'Anonymous' } : message.sender,
        },
      };

      this.server.to(`room_${data.roomId}`).emit('newRoomMessage', payload);
    }
  }
}
