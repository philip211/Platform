import { Module } from '@nestjs/common';
import { MafiaService } from './mafia.service';
import { MafiaController } from './mafia.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AutoJoinController } from './controllers/auto-join.controller';
import { MafiaGateway } from './gateway/mafia.gateway';
import { GameLoggerService } from './logger/game-logger.service';

@Module({
  providers: [MafiaService, PrismaService, MafiaGateway, GameLoggerService],
  controllers: [MafiaController, AutoJoinController],
  exports: [MafiaService, GameLoggerService],
})
export class MafiaModule {}
