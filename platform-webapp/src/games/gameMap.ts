import MafiaChicagoGame from '../modules/mafia-chicago/pages/MafiaChicagoGame';

export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  component: React.ComponentType;
  isActive: boolean;
}

const gameMap: Record<string, GameMetadata> = {
  'mafia-chicago': {
    id: 'mafia-chicago',
    name: 'Мафия: Чикаго',
    description: 'Классическая игра в мафию с атмосферой Чикаго 30-х годов',
    thumbnailUrl: '/images/games/mafia-chicago.jpg',
    component: MafiaChicagoGame,
    isActive: true
  },
};

export const getGameById = (id: string): GameMetadata | undefined => {
  return gameMap[id];
};

export const getActiveGames = (): GameMetadata[] => {
  return Object.values(gameMap).filter(game => game.isActive);
};

export default gameMap;
