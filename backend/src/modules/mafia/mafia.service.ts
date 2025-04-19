import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class MafiaService {
  constructor(private prisma: PrismaService) {}

  async createOrJoinRoom(telegramId: string, name: string, inviteCode?: string) {
    let user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      console.log(`Creating new user with telegramId: ${telegramId}, name: ${name}`);
      user = await this.prisma.user.create({
        data: {
          telegramId,
          firstName: name,
          lastName: '',
          username: `user_${telegramId.substring(0, 8)}`,
        },
      });
    }

    if (inviteCode) {
      const roomWithInvite = await this.prisma.room.findFirst({
        where: {
          inviteCode,
          status: 'WAITING',
        },
        include: {
          players: true,
          game: true,
        },
      });

      if (!roomWithInvite) {
        throw new Error('Комната по приглашению не найдена или игра уже началась');
      }

      if (roomWithInvite.players.length >= 8) {
        throw new Error('Комната уже заполнена');
      }

      const existingPlayer = roomWithInvite.players.find(
        (p) => p.userId === user.id,
      );

      if (existingPlayer) {
        return { roomId: roomWithInvite.id, playerId: existingPlayer.id, inviteCode: roomWithInvite.inviteCode };
      }

      if (!roomWithInvite.game) {
        throw new Error('Game not found for this room');
      }
      
      const player = await this.prisma.gamePlayer.create({
        data: {
          userId: user.id,
          roomId: roomWithInvite.id,
          gameId: roomWithInvite.game.id,
          role: 'CIVILIAN', // Default role
        },
      });

      return { roomId: roomWithInvite.id, playerId: player.id, inviteCode: roomWithInvite.inviteCode };
    }

    const defaultRoom = await this.prisma.room.findFirst({
      where: {
        name: 'Mafia: Chicago',
        status: 'WAITING',
        players: {
          some: {}, // Make sure the room has at least one player
        },
      },
      include: {
        players: true,
        game: true,
      },
      orderBy: {
        createdAt: 'asc', // Get the oldest waiting room first
      },
    });
    
    if (defaultRoom && defaultRoom.players.length < 8) {
      const existingPlayer = defaultRoom.players.find(
        (p) => p.userId === user.id,
      );

      if (existingPlayer) {
        return { 
          roomId: defaultRoom.id, 
          playerId: existingPlayer.id, 
          inviteCode: defaultRoom.inviteCode 
        };
      }

      if (!defaultRoom.game) {
        throw new Error('Game not found for this room');
      }
      
      const player = await this.prisma.gamePlayer.create({
        data: {
          userId: user.id,
          roomId: defaultRoom.id,
          gameId: defaultRoom.game.id,
          role: 'CIVILIAN', // Default role
        },
      });

      return { 
        roomId: defaultRoom.id, 
        playerId: player.id, 
        inviteCode: defaultRoom.inviteCode 
      };
    }
    
    const emptyRoom = await this.prisma.room.findFirst({
      where: {
        name: 'Mafia: Chicago',
        status: 'WAITING',
      },
      include: {
        players: true,
        game: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    if (emptyRoom && emptyRoom.players.length < 8) {
      const existingPlayer = emptyRoom.players.find(
        (p) => p.userId === user.id,
      );

      if (existingPlayer) {
        return { 
          roomId: emptyRoom.id, 
          playerId: existingPlayer.id, 
          inviteCode: emptyRoom.inviteCode 
        };
      }

      if (!emptyRoom.game) {
        throw new Error('Game not found for this room');
      }
      
      const player = await this.prisma.gamePlayer.create({
        data: {
          userId: user.id,
          roomId: emptyRoom.id,
          gameId: emptyRoom.game.id,
          role: 'CIVILIAN', // Default role
        },
      });

      return { 
        roomId: emptyRoom.id, 
        playerId: player.id, 
        inviteCode: emptyRoom.inviteCode 
      };
    }

    const inviteCodeForNewRoom = this.generateInviteCode();

    const newRoom = await this.prisma.room.create({
      data: {
        name: 'Mafia: Chicago',
        status: 'WAITING',
        inviteCode: inviteCodeForNewRoom,
        owner: {
          connect: {
            id: user.id,
          },
        },
        game: {
          create: {},
        },
      },
      include: {
        game: true,
      },
    });

    if (!newRoom.game) {
      throw new Error('Game not found for this room');
    }
    
    const player = await this.prisma.gamePlayer.create({
      data: {
        userId: user.id,
        roomId: newRoom.id,
        gameId: newRoom.game.id,
        role: 'CIVILIAN', // Default role
      },
    });

    return { 
      roomId: newRoom.id, 
      playerId: player.id,
      inviteCode: newRoom.inviteCode 
    };
  }
  
  private generateInviteCode(): string {
    return randomBytes(4).toString('hex');
  }
  
  async createInviteCode(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'WAITING') {
      throw new Error('Cannot create invite for a room that is not in waiting status');
    }

    if (!room.inviteCode) {
      const inviteCode = this.generateInviteCode();
      
      await this.prisma.room.update({
        where: { id: roomId },
        data: { inviteCode },
      });
      
      return { inviteCode };
    }
    
    return { inviteCode: room.inviteCode };
  }
  
  async getInviteCode(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error('Room not found');
    }
    
    return { inviteCode: room.inviteCode };
  }
  
  async submitRoleAction(playerId: string, targetId: string, action: string, location?: string) {
    const player = await this.prisma.gamePlayer.findUnique({
      where: { id: playerId },
      include: {
        game: true,
        user: true,
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    if (!player.isAlive) {
      throw new Error('Dead players cannot perform actions');
    }

    const target = await this.prisma.gamePlayer.findUnique({
      where: { id: targetId },
      include: {
        user: true,
      },
    });

    if (!target) {
      throw new Error('Target player not found');
    }

    await this.prisma.gameLog.create({
      data: {
        gameId: player.gameId,
        type: `ROLE_ACTION_${action.toUpperCase()}`,
        payload: {
          playerId,
          targetId,
          playerName: player.user.firstName,
          targetName: target.user.firstName,
          role: player.role,
          location: location || 'UNKNOWN',
        },
      },
    });

    return { success: true };
  }
  
  async resolveNight(roomId: string): Promise<any> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        game: true,
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }

    const nightActions = await this.prisma.gameLog.findMany({
      where: {
        gameId: room.game.id,
        type: {
          startsWith: 'ROLE_ACTION_',
        },
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mafiaActions = nightActions.filter(
      (action) => action.type === 'ROLE_ACTION_KILL',
    );
    
    const doctorActions = nightActions.filter(
      (action) => action.type === 'ROLE_ACTION_HEAL',
    );
    
    const sheriffActions = nightActions.filter(
      (action) => action.type === 'ROLE_ACTION_ARREST',
    );

  type PlayerActionResult = {
      playerId: string;
      playerName: string;
  };

  type NightResults = {
      killed: PlayerActionResult[];
      saved: PlayerActionResult[];
      arrested: PlayerActionResult[];
  };

  const results: NightResults = {
      killed: [],
      saved: [],
      arrested: [],
  };

    for (const action of mafiaActions) {
      if (!action.payload) continue;
      
      const payload = action.payload as Record<string, any>;
      const targetId = payload['targetId'] as string;
      const targetName = payload['targetName'] as string;
      
      if (!targetId) continue;
      
      const wasHealed = doctorActions.some(
        (heal) => {
          if (!heal.payload) return false;
          const healPayload = heal.payload as Record<string, any>;
          return healPayload['targetId'] === targetId;
        }
      );
      
      if (!wasHealed) {
        await this.prisma.gamePlayer.update({
          where: { id: targetId },
          data: { isAlive: false },
        });
        
        results.killed.push({
          playerId: targetId,
          playerName: targetName,
        });
      } else {
        results.saved.push({
          playerId: targetId,
          playerName: targetName,
        });
      }
    }
    
    for (const action of sheriffActions) {
      if (!action.payload) continue;
      
      const payload = action.payload as Record<string, any>;
      const targetId = payload['targetId'] as string;
      const targetName = payload['targetName'] as string;
      
      if (!targetId) continue;
      
      await this.prisma.gameLog.create({
        data: {
          gameId: room.game.id,
          type: 'PLAYER_ARRESTED',
          payload: {
            playerId: targetId,
            playerName: targetName,
          },
        },
      });
      
      results.arrested.push({
        playerId: targetId,
        playerName: targetName,
      });
    }
    
    await this.prisma.gameLog.create({
      data: {
        gameId: room.game.id,
        type: 'NIGHT_RESULT',
        payload: JSON.parse(JSON.stringify(results)), // Convert to JSON-compatible format
      },
    });
    
    await this.moveToNextPhase(roomId);
    
    return results;
  }
  
  async submitVote(voterId: string, targetId: string) {
    const voter = await this.prisma.gamePlayer.findUnique({
      where: { id: voterId },
      include: {
        game: true,
        user: true,
      },
    });

    if (!voter) {
      throw new Error('Voter not found');
    }

    if (!voter.isAlive) {
      throw new Error('Dead players cannot vote');
    }

    const target = await this.prisma.gamePlayer.findUnique({
      where: { id: targetId },
      include: {
        user: true,
      },
    });

    if (!target) {
      throw new Error('Target player not found');
    }

    await this.prisma.gameLog.create({
      data: {
        gameId: voter.gameId,
        type: 'VOTE',
        payload: {
          voterId,
          targetId,
          voterName: voter.user.firstName,
          targetName: target.user.firstName,
        },
      },
    });

    return { success: true };
  }
  
  async resolveVote(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        game: true,
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }

    const votes = await this.prisma.gameLog.findMany({
      where: {
        gameId: room.game.id,
        type: 'VOTE',
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
    });

    const voteCounts: Record<string, number> = {};
    for (const vote of votes) {
      if (!vote.payload) continue;
      const payload = vote.payload as Record<string, any>;
      const targetId = payload['targetId'] as string;
      if (!targetId) continue;
      
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }

    let maxVotes = 0;
    let executedPlayerId: string | undefined = undefined;
    let executedPlayerName = '';
    
    for (const [playerId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        executedPlayerId = playerId;
      }
    }
    
    if (executedPlayerId) {
      const executedPlayer = room.players.find(p => p.id === executedPlayerId);
      
      if (executedPlayer) {
        executedPlayerName = executedPlayer.user.firstName;
        
        await this.prisma.gamePlayer.update({
          where: { id: executedPlayerId },
          data: { isAlive: false },
        });
        
        await this.prisma.gameLog.create({
          data: {
            gameId: room.game.id,
            type: 'EXECUTION',
            payload: {
              playerId: executedPlayerId,
              playerName: executedPlayerName,
              votes: maxVotes,
            },
          },
        });
      }
    }
    
    await this.moveToNextPhase(roomId);
    
    return { 
      executed: executedPlayerId ? {
        playerId: executedPlayerId,
        playerName: executedPlayerName,
        votes: maxVotes
      } : null,
      voteCounts
    };
  }
  
  async checkVictory(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        game: true,
        players: true,
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }

    const alivePlayers = room.players.filter(p => p.isAlive);
    const aliveMafia = alivePlayers.filter(p => p.role === 'MAFIA');
    const aliveCivilians = alivePlayers.filter(p => p.role !== 'MAFIA');
    
    let winner: string | undefined = undefined;
    let gameOver = false;
    
    if (aliveMafia.length > 0 && aliveCivilians.length <= 1) {
      winner = 'MAFIA';
      gameOver = true;
    }
    
    if (aliveMafia.length === 0 && aliveCivilians.length > 0) {
      winner = 'CIVILIANS';
      gameOver = true;
    }
    
    if (gameOver) {
      await this.prisma.gameLog.create({
        data: {
          gameId: room.game.id,
          type: 'GAME_OVER',
          payload: {
            winner,
            alivePlayers: alivePlayers.map(p => p.id),
          },
        },
      });
      
      await this.prisma.room.update({
        where: { id: roomId },
        data: { status: 'FINISHED' },
      });
      
      await this.prisma.game.update({
        where: { id: room.game.id },
        data: { endedAt: new Date() },
      });
    }
    
    return { 
      gameOver,
      winner,
      aliveMafia: aliveMafia.length,
      aliveCivilians: aliveCivilians.length
    };
  }
  
  async finishGame(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        game: true,
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }
    
    await this.prisma.room.update({
      where: { id: roomId },
      data: { status: 'FINISHED' },
    });
    
    await this.prisma.game.update({
      where: { id: room.game.id },
      data: { endedAt: new Date() },
    });
    
    await this.prisma.gameLog.create({
      data: {
        gameId: room.game.id,
        type: 'GAME_ENDED',
        payload: {},
      },
    });
    
    return { success: true };
  }
  
  async getGameState(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        game: true,
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }
    
    const phaseLog = await this.prisma.gameLog.findFirst({
      where: {
        gameId: room.game.id,
        type: 'PHASE_CHANGE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    let currentPhase = 'WAITING_FOR_PLAYERS';
    if (phaseLog && phaseLog.payload) {
      const payload = phaseLog.payload as Record<string, any>;
      currentPhase = payload['phase'] as string || currentPhase;
    }
    
    const recentLogs = await this.prisma.gameLog.findMany({
      where: {
        gameId: room.game.id,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit to 20 most recent logs
    });
    
    const players = room.players.map(player => ({
      id: player.id,
      name: player.user.firstName,
      role: player.role,
      isAlive: player.isAlive,
      roleRevealed: room.status === 'FINISHED',
    }));
    
    return {
      roomId: room.id,
      roomStatus: room.status,
      phase: currentPhase,
      players,
      logs: recentLogs,
      gameStarted: !!room.game.startedAt,
      gameEnded: !!room.game.endedAt,
    };
  }
  
  async moveToNextPhase(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        game: true,
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }
    
    const currentPhaseLog = await this.prisma.gameLog.findFirst({
      where: {
        gameId: room.game.id,
        type: 'PHASE_CHANGE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    let currentPhase = 'WAITING_FOR_PLAYERS';
    if (currentPhaseLog && currentPhaseLog.payload) {
      const payload = currentPhaseLog.payload as Record<string, any>;
      currentPhase = payload['phase'] as string || currentPhase;
    }
    
    const phases = [
      'WAITING_FOR_PLAYERS',
      'NIGHT_LOCATION_SELECTION',
      'NIGHT_ROLE_ACTIONS',
      'MORNING',
      'DISCUSSION',
      'VOTING',
      'DEATH',
    ];
    
    let nextPhaseIndex = phases.indexOf(currentPhase) + 1;
    
    if (nextPhaseIndex >= phases.length) {
      nextPhaseIndex = 1; // Start from NIGHT_LOCATION_SELECTION
    }
    
    if (currentPhase === 'WAITING_FOR_PLAYERS' && room.status === 'ACTIVE') {
      nextPhaseIndex = 1; // NIGHT_LOCATION_SELECTION
    }
    
    const nextPhase = phases[nextPhaseIndex];
    
    await this.prisma.gameLog.create({
      data: {
        gameId: room.game.id,
        type: 'PHASE_CHANGE',
        payload: {
          phase: nextPhase,
          previousPhase: currentPhase,
        },
      },
    });
    
    return { 
      previousPhase: currentPhase,
      currentPhase: nextPhase
    };
  }
  
  async getRoomByInviteCode(inviteCode: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        inviteCode,
        status: 'WAITING',
      },
    });

    if (!room) {
      throw new Error('Room not found or game already started');
    }

    return { roomId: room.id };
  }

  async getRoomPlayers(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    return room.players.map((player) => ({
      id: player.id,
      telegramId: player.user.telegramId,
      name: player.user.firstName,
      role: player.role,
      isAlive: player.isAlive,
    }));
  }

  async startGame(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        players: true,
        game: true,
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }

    if (room.players.length !== 8) {
      throw new Error('Need exactly 8 players to start the game');
    }

    const playerIds = room.players.map((p) => p.id);
    const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);

    await this.prisma.gamePlayer.update({
      where: { id: shuffledPlayers[0] },
      data: { role: 'MAFIA' },
    });

    await this.prisma.gamePlayer.update({
      where: { id: shuffledPlayers[1] },
      data: { role: 'DOCTOR' },
    });

    await this.prisma.gamePlayer.update({
      where: { id: shuffledPlayers[2] },
      data: { role: 'SHERIFF' },
    });

    await this.prisma.room.update({
      where: { id: roomId },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.game.update({
      where: { id: room.game.id },
      data: { startedAt: new Date() },
    });

    await this.prisma.gameLog.create({
      data: {
        gameId: room.game.id,
        type: 'GAME_STARTED',
        payload: {},
      },
    });

    return { success: true };
  }

  async sendGift(senderId: string, recipientId: string, giftType: string) {
    const sender = await this.prisma.gamePlayer.findUnique({
      where: { id: senderId },
      include: {
        game: true,
        user: true,
      },
    });

    if (!sender) {
      throw new Error('Sender not found');
    }

    if (!sender.isAlive) {
      throw new Error('Dead players cannot send gifts');
    }

    const recipient = await this.prisma.gamePlayer.findUnique({
      where: { id: recipientId },
      include: {
        user: true,
      },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    if (!recipient.isAlive) {
      throw new Error('Cannot send gifts to dead players');
    }

    const validGiftTypes = ['CIGAR', 'WHISKEY', 'KISS', 'ROSE', 'MONEY'];
    if (!validGiftTypes.includes(giftType)) {
      throw new Error('Invalid gift type');
    }

    await this.prisma.gameLog.create({
      data: {
        gameId: sender.gameId,
        type: 'GIFT',
        payload: {
          senderId,
          recipientId,
          senderName: sender.user.firstName,
          recipientName: recipient.user.firstName,
          giftType,
        },
      },
    });

    return { 
      success: true,
      gift: {
        senderId,
        recipientId,
        senderName: sender.user.firstName,
        recipientName: recipient.user.firstName,
        giftType,
      }
    };
  }

  
  async selectPlayerLocation(userId: string, roomId: string, locationId: string) {
    const player = await this.prisma.gamePlayer.findFirst({
      where: {
        userId,
        roomId,
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    await this.prisma.gameLog.create({
      data: {
        gameId: player.gameId,
        type: 'LOCATION_SELECTED',
        payload: {
          playerId: player.id,
          locationId,
        },
      },
    });

    return { success: true };
  }

  async processPlayerAction(userId: string, roomId: string, action: string, targetId?: string) {
    const player = await this.prisma.gamePlayer.findFirst({
      where: {
        userId,
        roomId,
      },
      include: {
        user: true,
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    if (targetId) {
      return this.submitRoleAction(player.id, targetId, action);
    }

    await this.prisma.gameLog.create({
      data: {
        gameId: player.gameId,
        type: `PLAYER_ACTION_${action.toUpperCase()}`,
        payload: {
          playerId: player.id,
          playerName: player.user.firstName,
          action,
        },
      },
    });

    return { success: true };
  }

  async processPlayerVote(userId: string, roomId: string, targetId: string) {
    const player = await this.prisma.gamePlayer.findFirst({
      where: {
        userId,
        roomId,
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    return this.submitVote(player.id, targetId);
  }

  async checkAllPlayersVoted(roomId: string): Promise<boolean> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        game: true,
        players: {
          where: {
            isAlive: true,
          },
        },
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }

    const recentVotes = await this.prisma.gameLog.findMany({
      where: {
        gameId: room.game.id,
        type: 'VOTE',
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
    });

    const uniqueVoters = new Set(recentVotes.map(vote => {
      if (!vote.payload) return null;
      const payload = vote.payload as Record<string, any>;
      return payload['voterId'] as string;
    }).filter(Boolean));

    return uniqueVoters.size >= room.players.length;
  }

  async advanceGamePhase(roomId: string) {
    return this.moveToNextPhase(roomId);
  }

  async processGift(senderId: string, recipientId: string, roomId: string, giftType: string) {
    return this.sendGift(senderId, recipientId, giftType);
  }

  async getVotes(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        game: true,
      },
    });

    if (!room || !room.game) {
      throw new Error('Room or game not found');
    }

    const votes = await this.prisma.gameLog.findMany({
      where: {
        gameId: room.game.id,
        type: 'VOTE',
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
    });

    return votes;
  }

  async autoJoinRoom(telegramId: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      console.log(`Creating new user with telegramId: ${telegramId}, name: ${name}`);
      user = await this.prisma.user.create({
        data: {
          telegramId,
          firstName: name,
          lastName: '',
          username: `user_${telegramId.substring(0, 8)}`,
        },
      });
    }

    const waitingRoom = await this.prisma.room.findFirst({
      where: {
        name: 'Mafia: Chicago',
        status: 'WAITING',
      },
      include: {
        players: true,
        game: true,
      },
      orderBy: {
        createdAt: 'asc', // Get the oldest waiting room first
      },
    });
    
    if (waitingRoom && waitingRoom.players.length < 8) {
      const existingPlayer = waitingRoom.players.find(
        (p) => p.userId === user.id,
      );

      if (existingPlayer) {
        return { 
          roomId: waitingRoom.id, 
          playerId: existingPlayer.id, 
          inviteCode: waitingRoom.inviteCode,
          isNewRoom: false,
          playersCount: waitingRoom.players.length,
          maxPlayers: 8,
        };
      }

      if (!waitingRoom.game) {
        throw new Error('Game not found for this room');
      }
      
      const player = await this.prisma.gamePlayer.create({
        data: {
          userId: user.id,
          roomId: waitingRoom.id,
          gameId: waitingRoom.game.id,
          role: 'CIVILIAN', // Default role
        },
      });

      if (waitingRoom.players.length + 1 >= 8) {
        await this.startGame(waitingRoom.id);
      }

      return { 
        roomId: waitingRoom.id, 
        playerId: player.id, 
        inviteCode: waitingRoom.inviteCode,
        isNewRoom: false,
        playersCount: waitingRoom.players.length + 1,
        maxPlayers: 8,
      };
    }
    
    const inviteCodeForNewRoom = this.generateInviteCode();

    const newRoom = await this.prisma.room.create({
      data: {
        name: 'Mafia: Chicago',
        status: 'WAITING',
        inviteCode: inviteCodeForNewRoom,
        owner: {
          connect: {
            id: user.id,
          },
        },
        game: {
          create: {},
        },
      },
      include: {
        game: true,
      },
    });

    if (!newRoom.game) {
      throw new Error('Game not found for this room');
    }
    
    const player = await this.prisma.gamePlayer.create({
      data: {
        userId: user.id,
        roomId: newRoom.id,
        gameId: newRoom.game.id,
        role: 'CIVILIAN', // Default role
      },
    });

    return { 
      roomId: newRoom.id, 
      playerId: player.id,
      inviteCode: newRoom.inviteCode,
      isNewRoom: true,
      playersCount: 1,
      maxPlayers: 8,
    };
  }
}
