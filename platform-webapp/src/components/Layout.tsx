import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import './Layout.scss';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isGamePage = location.pathname.includes('/games/');
  
  const handlers = useSwipeable({
    onSwipedRight: () => {
      if (isGamePage) return;
      console.log('⬅️ Свайп вправо — переход в каталог');
      navigate('/catalog');
    },
    onSwipedLeft: () => {
      if (isGamePage) return;
      console.log('➡️ Свайп влево — переход в профиль');
      navigate('/profile');
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
  });
  
  const pageVariants = {
    initial: {
      opacity: 0,
    },
    in: {
      opacity: 1,
    },
    out: {
      opacity: 0,
    }
  };
  
  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  };
  
  return (
    <div className="app-layout" {...(isGamePage ? {} : handlers)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="page-container"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      
      {!isGamePage && (
        <div className="swipe-indicators">
          <div className="swipe-indicator swipe-indicator--left">
            <span>Каталог</span>
            <div className="swipe-arrow">←</div>
          </div>
          <div className="swipe-indicator swipe-indicator--right">
            <span>Профиль</span>
            <div className="swipe-arrow">→</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
