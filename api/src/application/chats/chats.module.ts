import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { User } from '../users/entities/user.entity';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { MessagesModule } from '../messages/messages.module';
import { RoomMessagesModule } from '../room-messages/room-messages.module';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, User]),
    AuthModule,
    MessagesModule,
    RoomMessagesModule,
    RoomsModule,
    UsersModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatGateway],
  exports: [ChatsService],
})
export class ChatsModule {}
