// src/user/user.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('user')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMe(@Query('telegramId') telegramId: string) {
    if (!telegramId) {
      throw new BadRequestException('telegramId is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        isPremium: true,
        coins: true,
        stars: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }
}
