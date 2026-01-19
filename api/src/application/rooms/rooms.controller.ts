import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Delete,
  Put,
  UseGuards,
  Query,
  Req,
  Request,
} from '@nestjs/common';
import { RoomService } from './rooms.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { AddRoomMemberDto } from './dtos/add-room-member.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { JwtAuthGuard } from 'src/application/auth/jwt-auth.guard';

@Controller('rooms')
export class RoomController {
  constructor(private roomService: RoomService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createRoom(@Body() dto: CreateRoomDto, @Request() req) {
    return this.roomService.createRoom(req.user.userId, dto);
  }

  @Put(':roomId')
  @UseGuards(JwtAuthGuard)
  updateRoom(
    @Param('roomId') roomId: number,
    @Body() dto: UpdateRoomDto,
    @Request() req,
  ) {
    return this.roomService.updateRoom(roomId, req.user.userId, dto);
  }

  @Delete(':roomId')
  @UseGuards(JwtAuthGuard)
  deleteRoom(@Param('roomId') roomId: number, @Request() req) {
    return this.roomService.deleteRoom(roomId, req.user.userId);
  }

  @Get()
  getAllRooms(@Query('categoryId') categoryId: number) {
    return this.roomService.getAllRooms(categoryId);
  }

  @Get('/created')
  @UseGuards(JwtAuthGuard)
  getMyCreatedRooms(@Request() req) {
    return this.roomService.getMyCreatedRooms(req.user.userId);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getMyRooms(@Request() req) {
    return this.roomService.getMyRooms(req.user.userId);
  }
  @Get('/count')
  getRoomCount() {
    return this.roomService.totalRoomsCount();
  }

  @Get(':roomId')
  getRoomById(@Param('roomId') roomId: number) {
    return this.roomService.getRoomById(roomId);
  }

  @Get(':roomCode')
  getRoomByCode(@Param('roomCode') roomCode: string) {
    return this.roomService.getRoomByCode(roomCode);
  }

  @Post('add-member')
  @UseGuards(JwtAuthGuard)
  addMember(@Body() dto: AddRoomMemberDto) {
    return this.roomService.addMember(dto);
  }

  @Delete(':roomId/remove/:userId')
  @UseGuards(JwtAuthGuard)
  removeMember(
    @Param('roomId') roomId: number,
    @Param('userId') userId: number,
  ) {
    return this.roomService.removeMember(roomId, userId);
  }

  @Get(':roomId/members')
  getMembers(@Param('roomId') roomId: number) {
    return this.roomService.getMembers(roomId);
  }

  @Post(':roomId/toggle-anonymous')
  @UseGuards(JwtAuthGuard)
  toggleAnonymousMode(@Param('roomId') roomId: number, @Request() req) {
    return this.roomService.toggleAnonymousMode(roomId, req.user.userId);
  }
}
