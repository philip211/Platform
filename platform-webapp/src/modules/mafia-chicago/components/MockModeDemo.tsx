import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTelegramContext } from '../../../contexts/TelegramContext';
import '../styles/MockModeDemo.scss';

interface MockModeDemoProps {
  onStartDemo: () => void;
}

const MockModeDemo: React.FC<MockModeDemoProps> = ({ onStartDemo }) => {
  const { isMockMode } = useTelegramContext();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isMockMode) {
    return null;
  }

  return (
    <div className="mock-mode-demo">
      <motion.div 
        className="mock-mode-demo__container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mock-mode-demo__header">
          <h2 className="mock-mode-demo__title">Демо-режим</h2>
          <p className="mock-mode-demo__subtitle">
            Вы находитесь в демо-режиме Telegram WebApp
          </p>
        </div>

        <div className="mock-mode-demo__content">
          <p>
            Telegram WebApp не загрузился или вы открыли приложение вне Telegram.
            В демо-режиме вы можете ознакомиться с игрой "Мафия: Чикаго" без подключения к Telegram.
          </p>

          {isExpanded && (
            <div className="mock-mode-demo__details">
              <h3>Что доступно в демо-режиме:</h3>
              <ul>
                <li>Просмотр интерфейса игры</li>
                <li>Тестирование игрового процесса</li>
                <li>Ознакомление с правилами</li>
              </ul>
              <h3>Ограничения демо-режима:</h3>
              <ul>
                <li>Нет сохранения прогресса</li>
                <li>Нет мультиплеера с реальными игроками</li>
                <li>Нет интеграции с Telegram</li>
              </ul>
            </div>
          )}

          <div className="mock-mode-demo__actions">
            <motion.button 
              className="mock-mode-demo__button mock-mode-demo__button--info"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Скрыть информацию' : 'Подробнее'}
            </motion.button>
            
            <motion.button 
              className="mock-mode-demo__button mock-mode-demo__button--start"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartDemo}
            >
              Начать демо-игру
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MockModeDemo;
