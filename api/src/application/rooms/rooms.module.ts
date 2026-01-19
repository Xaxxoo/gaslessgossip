import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { RoomCategory } from '../room-categories/entities/room-category.entity';
import { RoomMember } from './entities/room-member.entity';
import { RoomService } from './rooms.service';
import { RoomController } from './rooms.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomCategory, RoomMember, User])],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomsModule {}
