import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/PhaseTransition.scss';

type TransitionType = 'night' | 'morning' | 'execution' | 'victory' | 'defeat';

interface PhaseTransitionProps {
  type: TransitionType;
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
}

const PhaseTransition: React.FC<PhaseTransitionProps> = ({
  type,
  isVisible,
  onComplete,
  duration = 2000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        if (onComplete) onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);
  
  const getTransitionContent = () => {
    switch (type) {
      case 'night':
        return (
          <>
            <div className="transition-icon">🌙</div>
            <h2 className="transition-text">Наступает ночь...</h2>
          </>
        );
      case 'morning':
        return (
          <>
            <div className="transition-icon">☀️</div>
            <h2 className="transition-text">Наступает утро...</h2>
          </>
        );
      case 'execution':
        return (
          <>
            <div className="transition-icon">⚰️</div>
            <h2 className="transition-text">Казнь...</h2>
          </>
        );
      case 'victory':
        return (
          <>
            <div className="transition-icon">🏆</div>
            <h2 className="transition-text">Победа!</h2>
          </>
        );
      case 'defeat':
        return (
          <>
            <div className="transition-icon">💀</div>
            <h2 className="transition-text">Поражение...</h2>
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div 
          className={`phase-transition phase-transition--${type}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="transition-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {getTransitionContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhaseTransition;
