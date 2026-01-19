import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AddRoomMemberDto } from './dtos/add-room-member.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { Room } from './entities/room.entity';
import { RoomMember } from './entities/room-member.entity';
import { User } from '../users/entities/user.entity';
import { RoomCategory } from '../room-categories/entities/room-category.entity';
import { CreateRoomDto } from './dtos/create-room.dto';
import { generateRoomCode } from '../../common/helpers/string';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private roomsRepository: Repository<Room>,
    @InjectRepository(RoomMember)
    private roomMembersRepository: Repository<RoomMember>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(RoomCategory)
    private roomCategoriesRepository: Repository<RoomCategory>,
  ) {}

  async totalRoomsCount() {
    return await this.roomsRepository.count();
  }

  async createRoom(userId: number, dto: CreateRoomDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    let category;
    if (dto.roomCategoryId) {
      category = await this.roomCategoriesRepository.findOne({
        where: { id: dto.roomCategoryId },
      });
      if (!category) throw new NotFoundException('Room category not found');
    }

    const code = generateRoomCode();

    const roomData: DeepPartial<Room> = {
      name: dto.name,
      photo: dto.photo,
      description: dto.description,
      type: dto.type ?? 'public',
      duration: dto.duration ?? 60,
      fee: dto.type === 'paid' ? (dto.fee ?? 0) : 0,
      room_category: category,
      owner: user,
      code,
      status: 'active',
      is_disposable: dto.is_disposable ?? false,
      expiresAt: dto.expiresAt,
    };

    const room = this.roomsRepository.create(roomData);
    const savedRoom = await this.roomsRepository.save(room);

    const roomMember = this.roomMembersRepository.create({
      user,
      room: savedRoom,
      role: 'owner',
    });
    await this.roomMembersRepository.save(roomMember);

    return savedRoom;
  }

  async updateRoom(roomId: number, userId: number, dto: UpdateRoomDto) {
    const room = await this.getRoomByIdAndUserId(roomId, userId);

    room.name = dto.name ?? room.name;
    room.photo = dto.photo ?? room.photo;
    room.description = dto.description ?? room.description;
    room.type = dto.type ?? room.type;
    room.duration = dto.duration ?? room.duration;
    room.fee = room.type === 'paid' ? (dto.fee ?? room.fee) : 0;

    if (dto.roomCategoryId) {
      const category = await this.roomCategoriesRepository.findOne({
        where: { id: dto.roomCategoryId },
      });
      if (!category) throw new NotFoundException('Room category not found');
      room.room_category = category;
    }

    return await this.roomsRepository.save(room);
  }

  async getAllRooms(categoryId?: number) {
    const query = this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.room_category', 'category')
      .leftJoinAndSelect('room.members', 'member')
      .leftJoinAndSelect('member.user', 'memberUser')
      .orderBy('room.createdAt', 'DESC');

    if (categoryId) {
      query.where('category.id = :categoryId', { categoryId });
    }

    return query.getMany();
  }

  async getMyCreatedRooms(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.room_category', 'category')
      .leftJoinAndSelect('room.members', 'member')
      .leftJoinAndSelect('member.user', 'memberUser')
      .where('room.ownerId = :userId', { userId })
      .orderBy('room.createdAt', 'DESC')
      .getMany();
  }

  async getMyRooms(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.room_category', 'category')
      .leftJoinAndSelect('room.members', 'member')
      .leftJoinAndSelect('member.user', 'memberUser')
      .innerJoin('room.members', 'rm', 'rm.userId = :userId', { userId })
      .orderBy('room.createdAt', 'DESC')
      .getMany();
  }

  async getRoomById(id: number) {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ['room_category', 'members', 'members.user', 'messages'],
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getRoomByIdAndUserId(id: number, userId: number) {
    const room = await this.roomsRepository.findOne({
      where: { id, owner: { id: userId } },
      relations: ['room_category', 'members', 'members.user', 'messages'],
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getRoomByCode(code: string) {
    const room = await this.roomsRepository.findOne({
      where: { code },
      relations: ['room_category', 'members', 'members.user', 'messages'],
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async deleteRoom(id: number, userId: number) {
    const room = await this.getRoomByIdAndUserId(id, userId);
    return this.roomsRepository.remove(room);
  }

  async addMember(dto: AddRoomMemberDto) {
    const room = await this.roomsRepository.findOne({
      where: { id: dto.roomId },
    });
    const user = await this.usersRepository.findOne({
      where: { id: dto.userId },
    });

    if (!room || !user) throw new NotFoundException('Room or user not found');

    const member = this.roomMembersRepository.create({
      room,
      user,
      role: dto.role || 'member',
    });

    return this.roomMembersRepository.save(member);
  }

  async removeMember(roomId: number, userId: number) {
    const member = await this.roomMembersRepository.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    await this.roomMembersRepository.remove(member);
    return { success: true };
  }

  async getMembers(roomId: number) {
    return this.roomMembersRepository.find({
      where: { room: { id: roomId } },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async toggleAnonymousMode(roomId: number, userId: number) {
    const room = await this.getRoomByIdAndUserId(roomId, userId);
    room.anonymous_mode = !room.anonymous_mode;
    return await this.roomsRepository.save(room);
  }
}
