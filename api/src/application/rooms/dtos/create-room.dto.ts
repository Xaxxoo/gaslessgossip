import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsString()
  photo?: string;

  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: 'public' | 'paid' | 'invite_only';

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  fee?: number;

  @IsOptional()
  @IsNumber()
  roomCategoryId?: number;

  @IsOptional()
  is_disposable?: boolean;

  @IsOptional()
  expiresAt?: Date;
}
