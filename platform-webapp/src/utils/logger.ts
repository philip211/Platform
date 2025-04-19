/**
 * Frontend logger utility for Mafia: Chicago game
 * Provides structured logging with different log levels and event types
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export enum GameEventType {
  CONNECTION = 'connection',
  DISCONNECTION = 'disconnection',
  ROOM_JOINED = 'room_joined',
  GAME_STARTED = 'game_started',
  PHASE_CHANGED = 'phase_changed',
  PLAYER_ACTION = 'player_action',
  VOTE_CAST = 'vote_cast',
  GIFT_SENT = 'gift_sent',
  PLAYER_DIED = 'player_died',
  GAME_ENDED = 'game_ended',
  WEBSOCKET = 'websocket',
  ERROR = 'error'
}

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

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: Array<{timestamp: string, level: string, message: string, data?: any}> = [];
  private maxLogSize: number = 1000; // Maximum number of logs to keep in memory
  private isEnabled: boolean = true;
  
  private constructor() {
    const storedLevel = localStorage.getItem('mafia_log_level');
    if (storedLevel) {
      this.logLevel = parseInt(storedLevel, 10);
    } else {
      this.logLevel = import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG;
    }
    
    const loggingDisabled = localStorage.getItem('mafia_logging_disabled');
    if (loggingDisabled === 'true') {
      this.isEnabled = false;
    }
  }
  
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    localStorage.setItem('mafia_log_level', level.toString());
  }
  
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('mafia_logging_disabled', (!enabled).toString());
  }
  
  public getLogs(): Array<{timestamp: string, level: string, message: string, data?: any}> {
    return this.logs;
  }
  
  public clearLogs(): void {
    this.logs = [];
  }
  
  public exportLogs(): string {
    return JSON.stringify(this.logs);
  }
  
  public error(message: string, data?: any): void {
    if (this.isEnabled && this.logLevel >= LogLevel.ERROR) {
      this.logWithLevel('ERROR', message, data);
    }
  }
  
  public warn(message: string, data?: any): void {
    if (this.isEnabled && this.logLevel >= LogLevel.WARN) {
      this.logWithLevel('WARN', message, data);
    }
  }
  
  public info(message: string, data?: any): void {
    if (this.isEnabled && this.logLevel >= LogLevel.INFO) {
      this.logWithLevel('INFO', message, data);
    }
  }
  
  public debug(message: string, data?: any): void {
    if (this.isEnabled && this.logLevel >= LogLevel.DEBUG) {
      this.logWithLevel('DEBUG', message, data);
    }
  }
  
  public logGameEvent(eventType: GameEventType, data: GameEventData): void {
    const message = this.formatEventMessage(eventType, data);
    
    switch (eventType) {
      case GameEventType.ERROR:
        this.error(`[${eventType}] ${message}`, data);
        break;
      case GameEventType.CONNECTION:
      case GameEventType.DISCONNECTION:
      case GameEventType.ROOM_JOINED:
      case GameEventType.GAME_STARTED:
      case GameEventType.PHASE_CHANGED:
      case GameEventType.GAME_ENDED:
        this.info(`[${eventType}] ${message}`, data);
        break;
      default:
        this.debug(`[${eventType}] ${message}`, data);
    }
    
    this.sendLogsToServer(eventType, data);
  }
  
  private formatEventMessage(eventType: GameEventType, data: GameEventData): string {
    switch (eventType) {
      case GameEventType.CONNECTION:
        return `Connected to game server`;
      case GameEventType.DISCONNECTION:
        return `Disconnected from game server`;
      case GameEventType.ROOM_JOINED:
        return `Joined room ${data.roomId}`;
      case GameEventType.GAME_STARTED:
        return `Game started in room ${data.roomId}`;
      case GameEventType.PHASE_CHANGED:
        return `Phase changed to ${data.phase}`;
      case GameEventType.PLAYER_ACTION:
        return `Player ${data.playerName || data.playerId} performed ${data.action} on ${data.target || 'none'} in ${data.location || 'unknown location'}`;
      case GameEventType.VOTE_CAST:
        return `Voted for ${data.target || 'no one'}`;
      case GameEventType.GIFT_SENT:
        return `Sent ${data.gift} to ${data.target}`;
      case GameEventType.PLAYER_DIED:
        return `Player ${data.playerName || data.playerId} died`;
      case GameEventType.GAME_ENDED:
        return `Game ended. Winner: ${data.winner}`;
      case GameEventType.WEBSOCKET:
        return `WebSocket: ${data.message}`;
      default:
        return JSON.stringify(data);
    }
  }
  
  private logWithLevel(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    
    this.logs.push(logEntry);
    
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
    
    const emoji = this.getLogLevelEmoji(level);
    const formattedMessage = `${emoji} [${timestamp}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage, data);
        break;
      case 'WARN':
        console.warn(formattedMessage, data);
        break;
      case 'INFO':
        console.info(formattedMessage, data);
        break;
      case 'DEBUG':
        console.debug(formattedMessage, data);
        break;
      default:
        console.log(formattedMessage, data);
    }
  }
  
  private getLogLevelEmoji(level: string): string {
    switch (level) {
      case 'ERROR': return '❌';
      case 'WARN': return '⚠️';
      case 'INFO': return 'ℹ️';
      case 'DEBUG': return '🔍';
      default: return '📝';
    }
  }
  
  private sendLogsToServer(eventType: GameEventType, _data: GameEventData): void {
    if (!import.meta.env.PROD) return;
    if (eventType !== GameEventType.ERROR && eventType !== GameEventType.GAME_ENDED) return;
    
  }
}

export const logger = Logger.getInstance();

export const logGameEvent = (eventType: GameEventType, data: GameEventData): void => {
  logger.logGameEvent(eventType, data);
};

export const logConnection = (): void => {
  logger.logGameEvent(GameEventType.CONNECTION, {});
};

export const logDisconnection = (): void => {
  logger.logGameEvent(GameEventType.DISCONNECTION, {});
};

export const logRoomJoined = (roomId: string, playerId: string): void => {
  logger.logGameEvent(GameEventType.ROOM_JOINED, { roomId, playerId });
};

export const logGameStarted = (roomId: string, playerCount: number): void => {
  logger.logGameEvent(GameEventType.GAME_STARTED, { roomId, playerCount });
};

export const logPhaseChanged = (roomId: string, phase: string): void => {
  logger.logGameEvent(GameEventType.PHASE_CHANGED, { roomId, phase });
};

export const logPlayerAction = (
  playerId: string, 
  playerName: string, 
  action: string, 
  target?: string, 
  location?: string
): void => {
  logger.logGameEvent(GameEventType.PLAYER_ACTION, {
    playerId,
    playerName,
    action,
    target,
    location
  });
};

export const logVoteCast = (
  playerId: string, 
  playerName: string, 
  targetId: string, 
  targetName: string
): void => {
  logger.logGameEvent(GameEventType.VOTE_CAST, {
    playerId,
    playerName,
    target: targetId,
    targetName
  });
};

export const logGiftSent = (
  playerId: string, 
  playerName: string, 
  targetId: string, 
  targetName: string, 
  gift: string
): void => {
  logger.logGameEvent(GameEventType.GIFT_SENT, {
    playerId,
    playerName,
    target: targetId,
    targetName,
    gift
  });
};

export const logPlayerDied = (
  playerId: string, 
  playerName: string, 
  cause: string
): void => {
  logger.logGameEvent(GameEventType.PLAYER_DIED, {
    playerId,
    playerName,
    cause
  });
};

export const logGameEnded = (roomId: string, winner: string): void => {
  logger.logGameEvent(GameEventType.GAME_ENDED, {
    roomId,
    winner
  });
};

export const logWebSocketEvent = (message: string, data?: any): void => {
  logger.logGameEvent(GameEventType.WEBSOCKET, {
    message,
    ...data
  });
};

export const logError = (error: Error | string, context?: any): void => {
  logger.logGameEvent(GameEventType.ERROR, {
    error,
    ...context
  });
};
