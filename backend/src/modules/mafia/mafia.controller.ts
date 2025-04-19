import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { MafiaService } from './mafia.service';

@Controller('api/mafia')
export class MafiaController {
  constructor(private readonly mafiaService: MafiaService) {}

  @Post('join')
  async joinGame(@Body() data: { telegramId: string; name: string; inviteCode?: string }) {
    return this.mafiaService.createOrJoinRoom(data.telegramId, data.name, data.inviteCode);
  }

  @Get('players/:roomId')
  async getPlayers(@Param('roomId') roomId: string) {
    return this.mafiaService.getRoomPlayers(roomId);
  }

  @Post('start/:roomId')
  async startGame(@Param('roomId') roomId: string) {
    return this.mafiaService.startGame(roomId);
  }
  
  @Post('create-invite/:roomId')
  async createInvite(@Param('roomId') roomId: string) {
    return this.mafiaService.createInviteCode(roomId);
  }
  
  @Get('room-by-invite')
  async getRoomByInvite(@Query('code') inviteCode: string) {
    return this.mafiaService.getRoomByInviteCode(inviteCode);
  }
  
  @Get('invite/:roomId')
  async getInviteCode(@Param('roomId') roomId: string) {
    return this.mafiaService.getInviteCode(roomId);
  }
  
  @Post('submit-role-action')
  async submitRoleAction(@Body() data: { 
    playerId: string; 
    targetId: string; 
    action: string;
    location?: string;
  }) {
    return this.mafiaService.submitRoleAction(
      data.playerId, 
      data.targetId, 
      data.action,
      data.location
    );
  }
  
  @Post('resolve-night/:roomId')
  async resolveNight(@Param('roomId') roomId: string) {
    return this.mafiaService.resolveNight(roomId);
  }
  
  @Post('vote')
  async vote(@Body() data: { voterId: string; targetId: string }) {
    return this.mafiaService.submitVote(data.voterId, data.targetId);
  }
  
  @Post('resolve-vote/:roomId')
  async resolveVote(@Param('roomId') roomId: string) {
    return this.mafiaService.resolveVote(roomId);
  }
  
  @Post('check-victory/:roomId')
  async checkVictory(@Param('roomId') roomId: string) {
    return this.mafiaService.checkVictory(roomId);
  }
  
  @Post('finish-game/:roomId')
  async finishGame(@Param('roomId') roomId: string) {
    return this.mafiaService.finishGame(roomId);
  }
  
  @Get('state/:roomId')
  async getGameState(@Param('roomId') roomId: string) {
    return this.mafiaService.getGameState(roomId);
  }
  
  @Post('next-phase/:roomId')
  async nextPhase(@Param('roomId') roomId: string) {
    return this.mafiaService.moveToNextPhase(roomId);
  }
  
  @Post('send-gift')
  async sendGift(@Body() data: { senderId: string; recipientId: string; giftType: string }) {
    return this.mafiaService.sendGift(
      data.senderId,
      data.recipientId,
      data.giftType
    );
  }
}
