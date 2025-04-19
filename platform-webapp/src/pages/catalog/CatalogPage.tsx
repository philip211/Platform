import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getActiveGames, GameMetadata } from '../../games/gameMap';
import '../../modules/mafia-chicago/styles/CatalogPage.scss';

const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const activeGames = getActiveGames();

  const handleCardClick = (gameId: string) => {
    const testInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/game/${gameId}?inviteCode=${testInviteCode}`);
  };

  return (
    <div className="catalog-page">
      <h1 className="catalog-page__title">Каталог игр</h1>
      
      <div className="catalog-page__games">
        {activeGames.map((game: GameMetadata) => (
          <motion.div 
            key={game.id}
            className="game-card"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(game.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="game-card__image">
              <div className="game-card__image-overlay">
                <span className="game-card__badge">Новинка</span>
              </div>
              <div className="game-card__icon">
                {game.id === 'mafia-chicago' ? '🎩' : '🎮'}
              </div>
            </div>
            
            <div className="game-card__content">
              <h2 className="game-card__title">{game.name}</h2>
              <p className="game-card__description">
                {game.description}
              </p>
              
              <div className="game-card__footer">
                <div className="game-card__players">
                  <span className="game-card__players-icon">👥</span>
                  <span className="game-card__players-count">8 игроков</span>
                </div>
                
                <motion.button 
                  className="game-card__button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Играть
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CatalogPage;
