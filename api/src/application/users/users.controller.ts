import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Post,
  ParseIntPipe,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { BlocksService } from './blocks.service';
import { ChangePasswordDto, UpdateProfileDto } from './dtos/user.dto';
import {
  CurrentUser,
  CurrentUserData,
} from '@/common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly blocksService: BlocksService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves the authenticated user profile with complete information including stats, wallet balances, and verification status.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 1,
        username: 'johndoe',
        photo: 'https://example.com/photo.jpg',
        email: 'john@example.com',
        is_verified: true,
        address: '0x1234567890abcdef',
        xp: 150,
        title: 'Crypto Enthusiast',
        about: 'Love blockchain technology',
        created_at: '2024-01-01T00:00:00.000Z',
        stats: {
          posts: 25,
          followers: 100,
          following: 75,
        },
        wallet: {
          celo_address: '0xCeloAddress123',
          celo_balance: '100.50',
          base_address: '0xBaseAddress456',
          base_balance: '50.25',
          starknet_address: '0xStarknetAddress789',
          starknet_balance: '75.00',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  getProfile(@CurrentUser() user: CurrentUserData) {
    return this.usersService.findById(user.userId);
  }

  @Get('profile/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user statistics',
    description:
      'Retrieves posts, followers, and following counts for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      example: {
        posts: 25,
        followers: 100,
        following: 75,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  getProfileStats(@CurrentUser() user: CurrentUserData) {
    return this.usersService.profileStats(user.userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Update profile information. Cannot update id, xp, is_verified, or password through this endpoint. Email and username must be unique.',
  })
  @ApiBody({
    type: UpdateProfileDto,
    examples: {
      basic: {
        summary: 'Update basic info',
        value: {
          photo: 'https://example.com/new-photo.jpg',
          title: 'Blockchain Developer',
          about: 'Building the future of web3',
        },
      },
      username: {
        summary: 'Update username',
        value: {
          username: 'newusername',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        id: 1,
        username: 'newusername',
        photo: 'https://example.com/new-photo.jpg',
        email: 'john@example.com',
        is_verified: true,
        address: '0x1234567890abcdef',
        xp: 150,
        title: 'Blockchain Developer',
        about: 'Building the future of web3',
        created_at: '2024-01-01T00:00:00.000Z',
        stats: {
          posts: 25,
          followers: 100,
          following: 75,
        },
        wallet: {
          celo_address: '0xCeloAddress123',
          celo_balance: '100.50',
          base_address: '0xBaseAddress456',
          base_balance: '50.25',
          starknet_address: '0xStarknetAddress789',
          starknet_balance: '75.00',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 422,
    description:
      'Unprocessable Entity - Username/Email already taken or invalid payload',
    schema: {
      example: {
        statusCode: 422,
        message: 'Username not available',
        error: 'Unprocessable Entity',
      },
    },
  })
  updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateData: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, updateData);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Change password with validation. Requires old password verification. New password must be different and at least 8 characters.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      changePassword: {
        summary: 'Change password',
        value: {
          old_password: 'OldPassword123',
          new_password: 'NewSecurePassword456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Password validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: 'New password must be different from old password',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Old password is incorrect',
    schema: {
      example: {
        statusCode: 401,
        message: 'Old password is incorrect',
        error: 'Unauthorized',
      },
    },
  })
  changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() passwords: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      user.userId,
      passwords.old_password,
      passwords.new_password,
    );
  }

  @Get(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Follow a user',
    description: 'Follow another user by their ID. Cannot follow yourself.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to follow',
    example: 2,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully followed user',
    schema: {
      example: {
        message: 'You are now following johndoe',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot follow yourself or already following',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async followUser(
    @Param('id', ParseIntPipe) followedId: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    const followerId = user.userId;
    return this.usersService.followUser(followerId, followedId);
  }

  @Get(':id/unfollow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unfollow a user',
    description: 'Unfollow a user by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to unfollow',
    example: 2,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully unfollowed user',
    schema: {
      example: {
        message: 'Unfollowed successfully',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async unfollowUser(
    @Param('id', ParseIntPipe) followedId: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    const followerId = user.userId;
    return this.usersService.unfollowUser(followerId, followedId);
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get total user count',
    description: 'Returns the total number of registered users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Total user count',
    schema: {
      example: 1250,
    },
  })
  async totalUserCount() {
    return this.usersService.totalUserCount();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users (randomized)',
    description:
      'Retrieves all users except the authenticated user, in random order. Includes XP for gamification. Optional search filter.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search users by username',
    example: 'john',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    schema: {
      example: {
        users: [
          {
            id: 2,
            username: 'janedoe',
            photo: 'https://example.com/jane.jpg',
            title: 'NFT Collector',
            xp: 200,
          },
          {
            id: 3,
            username: 'bobsmith',
            photo: 'https://example.com/bob.jpg',
            title: 'DeFi Trader',
            xp: 350,
          },
        ],
      },
    },
  })
  async allUsers(
    @Query('search') search: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const { userId } = user;
    return this.usersService.allUsers(userId, search);
  }

  @Get('profile/:username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'View user profile by username',
    description:
      'View another user profile including stats, wallet addresses (no balances), relationship status, and posts. Excludes sensitive information.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username of the user to view',
    example: 'johndoe',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        user: {
          id: 2,
          username: 'johndoe',
          photo: 'https://example.com/photo.jpg',
          title: 'Crypto Enthusiast',
          about: 'Love blockchain technology',
          xp: 150,
          created_at: '2024-01-01T00:00:00.000Z',
        },
        chat: 123,
        stats: {
          posts: 25,
          followers: 100,
          following: 75,
        },
        isFollowing: true,
        isFollowedBy: false,
        wallet: {
          celo_address: '0xCeloAddress123',
          base_address: '0xBaseAddress456',
          starknet_address: '0xStarknetAddress789',
        },
        posts: [
          {
            id: 1,
            content: 'Hello World!',
            createdAt: '2024-01-01T00:00:00.000Z',
            hasLiked: true,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async viewProfile(
    @Param('username') username: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const { userId } = user;
    return this.usersService.viewUser(username, userId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search users by username',
    description:
      'Search for users by username with chat history prioritization. Returns users with existing chats first.',
  })
  @ApiQuery({
    name: 'username',
    required: true,
    description: 'Username search term',
    example: 'john',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      example: [
        {
          id: 2,
          username: 'johndoe',
          photo: 'https://example.com/photo.jpg',
          title: 'Crypto Enthusiast',
          chat_id: 123,
        },
        {
          id: 3,
          username: 'johnsmith',
          photo: 'https://example.com/photo2.jpg',
          title: null,
          chat_id: null,
        },
      ],
    },
  })
  async search(
    @Query('username') username: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const { userId } = user;
    return this.usersService.searchByUsername(username, userId);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get user statistics by ID',
    description: 'Get posts, followers, and following counts for any user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 2,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics',
    schema: {
      example: {
        posts: 25,
        followers: 100,
        following: 75,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserStats(@Param('id', ParseIntPipe) userId: number) {
    return this.usersService.profileStats(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Get complete user profile by ID including stats and wallet information. Returns full profile data.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 2,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 2,
        username: 'johndoe',
        photo: 'https://example.com/photo.jpg',
        email: 'john@example.com',
        is_verified: true,
        address: '0x1234567890abcdef',
        xp: 150,
        title: 'Crypto Enthusiast',
        about: 'Love blockchain technology',
        created_at: '2024-01-01T00:00:00.000Z',
        stats: {
          posts: 25,
          followers: 100,
          following: 75,
        },
        wallet: {
          celo_address: '0xCeloAddress123',
          celo_balance: '100.50',
          base_address: '0xBaseAddress456',
          base_balance: '50.25',
          starknet_address: '0xStarknetAddress789',
          starknet_balance: '75.00',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async viewUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Get(':username/followers')
  @ApiOperation({
    summary: 'Get user followers',
    description:
      'Retrieves the list of users following the specified user. Includes XP and title information.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username to get followers for',
    example: 'johndoe',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filter followers by username',
    example: 'jane',
  })
  @ApiResponse({
    status: 200,
    description: 'List of followers',
    schema: {
      example: [
        {
          id: 3,
          username: 'janedoe',
          photo: 'https://example.com/jane.jpg',
          title: 'NFT Collector',
          xp: 200,
        },
        {
          id: 4,
          username: 'bobsmith',
          photo: 'https://example.com/bob.jpg',
          title: 'DeFi Trader',
          xp: 350,
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async listFollowers(
    @Param('username') username: string,
    @Query('search') search: string,
  ) {
    return this.usersService.getFollowers(username, search);
  }

  @Get(':username/following')
  @ApiOperation({
    summary: 'Get users being followed',
    description:
      'Retrieves the list of users that the specified user is following. Includes XP and title information.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username to get following list for',
    example: 'johndoe',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filter following by username',
    example: 'jane',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users being followed',
    schema: {
      example: [
        {
          id: 5,
          username: 'alicejones',
          photo: 'https://example.com/alice.jpg',
          title: 'DAO Contributor',
          xp: 450,
        },
        {
          id: 6,
          username: 'charliebrown',
          photo: 'https://example.com/charlie.jpg',
          title: 'Smart Contract Dev',
          xp: 600,
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async listFollowing(
    @Param('username') username: string,
    @Query('search') search: string,
  ) {
    return this.usersService.getFollowing(username, search);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logout endpoint. JWT tokens are stateless, so client must delete the token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout instructions',
    schema: {
      example: {
        message: 'Logout successful on client side. Please delete your token.',
      },
    },
  })
  logout() {
    return {
      message: 'Logout successful on client side. Please delete your token.',
    };
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(
    @Param('id', ParseIntPipe) blockedId: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.blocksService.blockUser(user.userId, blockedId);
  }

  @Post(':id/unblock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(
    @Param('id', ParseIntPipe) blockedId: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.blocksService.unblockUser(user.userId, blockedId);
  }

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of blocked users' })
  async getBlockedUsers(@CurrentUser() user: CurrentUserData) {
    return this.blocksService.getBlockedUsers(user.userId);
  }
}
