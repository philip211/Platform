import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../../common/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Game event types for structured logging
 */
export enum GameEventType {
  CONNECTION = 'connection',
  DISCONNECTION = 'disconnection',
  ROOM_CREATED = 'room_created',
  PLAYER_JOINED = 'player_joined',
  GAME_STARTED = 'game_started',
  PHASE_CHANGED = 'phase_changed',
  PLAYER_ACTION = 'player_action',
  VOTE_CAST = 'vote_cast',
  GIFT_SENT = 'gift_sent',
  PLAYER_DIED = 'player_died',
  GAME_ENDED = 'game_ended',
  ERROR = 'error'
}

/**
 * Interface for game event data
 */
export interface GameEventData {
  roomId?: string;
  playerId?: string;
  playerName?: string;
  phase?: string;
  action?: string;
  target?: string;
  location?: string;
  error?: Error | string;
  [key: string]: any; // Allow additional properties
}

/**
 * Service for logging game events
 */
@Injectable()
export class GameLoggerService {
  private readonly logger = new AppLogger('MafiaGame');
  private readonly logDir: string;
  private readonly gameLogPath: string;
  private readonly errorLogPath: string;
  
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.gameLogPath = path.join(this.logDir, `mafia-game-${date}.log`);
    this.errorLogPath = path.join(this.logDir, `mafia-error-${date}.log`);
  }
  
  /**
   * Log a game event with structured data
   */
  logGameEvent(eventType: GameEventType, data: GameEventData): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      eventType,
      ...data
    };
    
    switch (eventType) {
      case GameEventType.ERROR:
        this.logger.error(`[${eventType}] ${data.error}`, data.error instanceof Error ? data.error.stack : undefined);
        break;
      case GameEventType.CONNECTION:
      case GameEventType.DISCONNECTION:
      case GameEventType.PLAYER_JOINED:
      case GameEventType.ROOM_CREATED:
        this.logger.log(`[${eventType}] ${this.formatEventMessage(eventType, data)}`);
        break;
      case GameEventType.PHASE_CHANGED:
      case GameEventType.GAME_STARTED:
      case GameEventType.GAME_ENDED:
        this.logger.log(`[${eventType}] ${this.formatEventMessage(eventType, data)}`);
        break;
      default:
        this.logger.debug(`[${eventType}] ${this.formatEventMessage(eventType, data)}`);
    }
    
    const logFilePath = eventType === GameEventType.ERROR ? this.errorLogPath : this.gameLogPath;
    fs.appendFile(
      logFilePath,
      JSON.stringify(logEntry) + '\n',
      { encoding: 'utf8' },
      (err) => {
        if (err) {
          console.error(`Failed to write to log file: ${err.message}`);
        }
      }
    );
  }
  
  /**
   * Format event message based on event type
   */
  private formatEventMessage(eventType: GameEventType, data: GameEventData): string {
    switch (eventType) {
      case GameEventType.CONNECTION:
        return `Client connected: ${data.playerId || 'Unknown'}`;
      case GameEventType.DISCONNECTION:
        return `Client disconnected: ${data.playerId || 'Unknown'}`;
      case GameEventType.ROOM_CREATED:
        return `Room created: ${data.roomId}`;
      case GameEventType.PLAYER_JOINED:
        return `Player ${data.playerName || data.playerId} joined room ${data.roomId}`;
      case GameEventType.GAME_STARTED:
        return `Game started in room ${data.roomId} with ${data.playerCount || '?'} players`;
      case GameEventType.PHASE_CHANGED:
        return `Phase changed to ${data.phase} in room ${data.roomId}`;
      case GameEventType.PLAYER_ACTION:
        return `Player ${data.playerName || data.playerId} performed ${data.action} on ${data.target || 'none'} in ${data.location || 'unknown location'}`;
      case GameEventType.VOTE_CAST:
        return `Player ${data.playerName || data.playerId} voted for ${data.target || 'no one'}`;
      case GameEventType.GIFT_SENT:
        return `Player ${data.playerName || data.playerId} sent ${data.gift} to ${data.target}`;
      case GameEventType.PLAYER_DIED:
        return `Player ${data.playerName || data.playerId} died in room ${data.roomId}`;
      case GameEventType.GAME_ENDED:
        return `Game ended in room ${data.roomId}. Winner: ${data.winner}`;
      default:
        return JSON.stringify(data);
    }
  }
  
  /**
   * Log connection event
   */
  logConnection(clientId: string, telegramId?: string): void {
    this.logGameEvent(GameEventType.CONNECTION, {
      playerId: clientId,
      telegramId
    });
  }
  
  /**
   * Log disconnection event
   */
  logDisconnection(clientId: string, roomId?: string): void {
    this.logGameEvent(GameEventType.DISCONNECTION, {
      playerId: clientId,
      roomId
    });
  }
  
  /**
   * Log room creation
   */
  logRoomCreated(roomId: string, creatorId: string): void {
    this.logGameEvent(GameEventType.ROOM_CREATED, {
      roomId,
      playerId: creatorId
    });
  }
  
  /**
   * Log player joining a room
   */
  logPlayerJoined(roomId: string, playerId: string, playerName: string): void {
    this.logGameEvent(GameEventType.PLAYER_JOINED, {
      roomId,
      playerId,
      playerName
    });
  }
  
  /**
   * Log game start
   */
  logGameStarted(roomId: string, playerCount: number): void {
    this.logGameEvent(GameEventType.GAME_STARTED, {
      roomId,
      playerCount
    });
  }
  
  /**
   * Log phase change
   */
  logPhaseChanged(roomId: string, phase: string): void {
    this.logGameEvent(GameEventType.PHASE_CHANGED, {
      roomId,
      phase
    });
  }
  
  /**
   * Log player action
   */
  logPlayerAction(roomId: string, playerId: string, playerName: string, action: string, target?: string, location?: string): void {
    this.logGameEvent(GameEventType.PLAYER_ACTION, {
      roomId,
      playerId,
      playerName,
      action,
      target,
      location
    });
  }
  
  /**
   * Log vote cast
   */
  logVoteCast(roomId: string, playerId: string, playerName: string, targetId: string, targetName: string): void {
    this.logGameEvent(GameEventType.VOTE_CAST, {
      roomId,
      playerId,
      playerName,
      target: targetId,
      targetName
    });
  }
  
  /**
   * Log gift sent
   */
  logGiftSent(roomId: string, playerId: string, playerName: string, targetId: string, targetName: string, gift: string): void {
    this.logGameEvent(GameEventType.GIFT_SENT, {
      roomId,
      playerId,
      playerName,
      target: targetId,
      targetName,
      gift
    });
  }
  
  /**
   * Log player death
   */
  logPlayerDied(roomId: string, playerId: string, playerName: string, cause: string): void {
    this.logGameEvent(GameEventType.PLAYER_DIED, {
      roomId,
      playerId,
      playerName,
      cause
    });
  }
  
  /**
   * Log game end
   */
  logGameEnded(roomId: string, winner: string): void {
    this.logGameEvent(GameEventType.GAME_ENDED, {
      roomId,
      winner
    });
  }
  
  /**
   * Log error
   */
  logError(error: Error | string, context?: GameEventData): void {
    this.logGameEvent(GameEventType.ERROR, {
      error,
      ...context
    });
  }
}
