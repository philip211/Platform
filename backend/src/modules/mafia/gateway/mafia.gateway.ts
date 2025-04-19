import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { MafiaService } from '../mafia.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { GameLoggerService, GameEventType } from '../logger/game-logger.service';
import * as crypto from 'crypto';

interface TelegramAuthHeaders {
  'x-telegram-id': string;
  'x-timestamp': string;
  'x-telegram-init-data'?: string;
  'x-signature'?: string;
  'x-dev-mode'?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'mafia',
})
export class MafiaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly nestLogger = new Logger(MafiaGateway.name);
  private playerRooms: Map<string, string> = new Map(); // socketId -> roomId
  private readonly BOT_TOKEN = process.env.BOT_TOKEN || '';
  private readonly DEV_MODE = process.env.NODE_ENV !== 'production';

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly mafiaService: MafiaService,
    private readonly prisma: PrismaService,
    private readonly gameLogger: GameLoggerService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      this.nestLogger.log(`Client attempting to connect: ${client.id}`);
      this.gameLogger.logConnection(client.id);
      
      if (this.DEV_MODE && process.env.SKIP_WS_AUTH === 'true') {
        this.nestLogger.warn('Skipping WebSocket authentication in development mode');
        return;
      }
      
      const auth = client.handshake.auth as TelegramAuthHeaders;
      
      if (!auth || !auth['x-telegram-id'] || !auth['x-timestamp']) {
        this.nestLogger.error('Missing required authentication headers');
        client.disconnect();
        return;
      }
      
      const telegramId = auth['x-telegram-id'];
      const timestamp = parseInt(auth['x-timestamp'], 10);
      const now = Date.now();
      
      if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
        this.nestLogger.error(`Invalid timestamp for client ${client.id}`);
        client.disconnect();
        return;
      }
      
      if (this.DEV_MODE && auth['x-dev-mode'] === 'true') {
        if (!auth['x-signature']) {
          this.nestLogger.error('Missing signature in dev mode');
          client.disconnect();
          return;
        }
        
        const expectedSignature = this.createDevModeSignature(
          parseInt(telegramId, 10),
          timestamp,
          'dev-mode',
        );
        
        if (auth['x-signature'] !== expectedSignature) {
          this.nestLogger.error('Invalid signature in dev mode');
          client.disconnect();
          return;
        }
        
        this.nestLogger.log(`Dev mode client authenticated: ${client.id}`);
        return;
      }
      
      if (!auth['x-telegram-init-data']) {
        this.nestLogger.error('Missing Telegram initData');
        client.disconnect();
        return;
      }
      
      const isValid = this.validateTelegramInitData(auth['x-telegram-init-data']);
      
      if (!isValid) {
        this.nestLogger.error(`Invalid Telegram initData for client ${client.id}`);
        client.disconnect();
        return;
      }
      
      this.nestLogger.log(`Client authenticated: ${client.id}`);
    } catch (error) {
      this.nestLogger.error(`Error during connection: ${error.message}`);
      client.disconnect();
    }
  }
  
  /**
   * Validates Telegram WebApp initData
   * @param initData The initData string from Telegram WebApp
   * @returns boolean indicating if the data is valid
   */
  private validateTelegramInitData(initData: string): boolean {
    try {
      if (!this.BOT_TOKEN) {
        this.nestLogger.error('BOT_TOKEN not configured');
        return false;
      }
      
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      
      if (!hash) {
        return false;
      }
      
      urlParams.delete('hash');
      
      const dataCheckArray = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`);
      
      const dataCheckString = dataCheckArray.join('\n');
      
      const secretKey = crypto.createHash('sha256')
        .update(this.BOT_TOKEN)
        .digest();
      
      const hmac = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      return hmac === hash;
    } catch (error) {
      this.nestLogger.error(`Error validating Telegram initData: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Creates a signature for dev mode authentication
   */
  private createDevModeSignature(telegramId: number, timestamp: number, devMode: string): string {
    const dataToSign = `${telegramId}:${timestamp}:${devMode}`;
    return crypto
      .createHash('sha256')
      .update(dataToSign)
      .digest('hex');
  }

  handleDisconnect(client: Socket): void {
    try {
      this.nestLogger.log(`Client disconnected: ${client.id}`);

      const roomId = this.playerRooms.get(client.id);
      if (roomId) {
        this.playerRooms.delete(client.id);
        this.gameLogger.logDisconnection(client.id, roomId);

        this.server.to(roomId).emit('playerDisconnected', { socketId: client.id });
        
        void this.broadcastGameState(roomId, 'Player disconnected from the game');

        void client.leave(roomId);
      } else {
        this.gameLogger.logDisconnection(client.id);
      }
    } catch (error) {
      this.nestLogger.error(`Error during disconnection: ${error.message}`);
      this.gameLogger.logError(error, { playerId: client.id });
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    try {
      const { roomId, userId } = data;

      void client.join(roomId);

      this.playerRooms.set(client.id, roomId);

      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: {
          players: {
            include: {
              user: true,
            },
          },
          game: true,
        },
      });

      if (!room) {
        throw new Error(`Room ${roomId} not found`);
      }

      const playerName = room.players.find(p => p.userId === userId)?.user?.username || userId;
      
      this.gameLogger.logPlayerJoined(roomId, userId, playerName);

      this.server.to(roomId).emit('playerJoined', {
        userId,
        socketId: client.id,
        room,
      });

      return { success: true, room };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.nestLogger.error(`Error joining room: ${errorMessage}`, errorStack);
      this.gameLogger.logError(error, { roomId: data?.roomId, playerId: data?.userId });
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('selectLocation')
  async handleSelectLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; locationId: string },
  ) {
    try {
      const { roomId, userId, locationId } = data;

      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: { 
          players: {
            where: { userId },
            include: { user: true }
          }
        }
      });
      
      const playerName = room?.players[0]?.user?.username || userId;

      await this.mafiaService.selectPlayerLocation(userId, roomId, locationId);
      
      this.gameLogger.logPlayerAction(
        roomId,
        userId,
        playerName,
        'select_location',
        undefined,
        locationId
      );

      const gameState = await this.mafiaService.getGameState(roomId);

      this.server.to(roomId).emit('gameStateUpdate', gameState);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.nestLogger.error(
        `Error selecting location: ${errorMessage}`,
        errorStack,
      );
      this.gameLogger.logError(error, { 
        roomId: data?.roomId, 
        playerId: data?.userId,
        locationId: data?.locationId 
      });
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('submitAction')
  async handleSubmitAction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; userId: string; action: string; targetId?: string },
  ) {
    try {
      const { roomId, userId, action, targetId } = data;

      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: { 
          players: {
            where: { userId },
            include: { user: true }
          }
        }
      });
      
      const playerName = room?.players[0]?.user?.username || userId;

      await this.mafiaService.processPlayerAction(
        userId,
        roomId,
        action,
        targetId,
      );
      
      this.gameLogger.logPlayerAction(
        roomId,
        userId,
        playerName,
        action,
        targetId,
        undefined
      );

      const gameState = await this.mafiaService.getGameState(roomId);

      this.server.to(roomId).emit('gameStateUpdate', gameState);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.nestLogger.error(`Error submitting action: ${errorMessage}`, errorStack);
      this.gameLogger.logError(error, { 
        roomId: data?.roomId, 
        playerId: data?.userId,
        action: data?.action,
        targetId: data?.targetId
      });
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('vote')
  async handleVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; targetId: string },
  ) {
    try {
      const { roomId, userId, targetId } = data;

      await this.mafiaService.processPlayerVote(userId, roomId, targetId);

      const gameState = await this.mafiaService.getGameState(roomId);

      this.server.to(roomId).emit('gameStateUpdate', gameState);

      const allVoted = await this.mafiaService.checkAllPlayersVoted(roomId);
      if (allVoted) {
        await this.mafiaService.advanceGamePhase(roomId);

        const updatedGameState = await this.mafiaService.getGameState(roomId);

        this.server.to(roomId).emit('gameStateUpdate', updatedGameState);
        this.server.to(roomId).emit('phaseChanged', {
          phase: updatedGameState.phase,
          timestamp: new Date(),
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.nestLogger.error(`Error processing vote: ${errorMessage}`, errorStack);
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('sendGift')
  async handleSendGift(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      senderId: string;
      receiverId: string;
      giftType: string;
    },
  ) {
    try {
      const { roomId, senderId, receiverId, giftType } = data;

      await this.mafiaService.processGift(
        senderId,
        receiverId,
        roomId,
        giftType,
      );

      this.server.to(roomId).emit('giftSent', {
        senderId,
        receiverId,
        giftType,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.nestLogger.error(`Error sending gift: ${errorMessage}`, errorStack);
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const { roomId } = data;

      await this.mafiaService.startGame(roomId);

      const gameState = await this.mafiaService.getGameState(roomId);
      
      this.gameLogger.logGameStarted(roomId, gameState.players.length);

      this.server.to(roomId).emit('gameStarted', gameState);
      this.server.to(roomId).emit('gameStateUpdate', gameState);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.nestLogger.error(`Error starting game: ${errorMessage}`, errorStack);
      this.gameLogger.logError(error, { roomId: data.roomId });
      return { success: false, error: errorMessage };
    }
  }

  async broadcastGameState(roomId: string, message?: string) {
    try {
      const gameState = await this.mafiaService.getGameState(roomId);
      this.server.to(roomId).emit('gameStateUpdate', gameState);
      
      if (message) {
        this.server.to(roomId).emit('systemMessage', {
          text: message,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.nestLogger.error(
        `Error broadcasting game state: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
