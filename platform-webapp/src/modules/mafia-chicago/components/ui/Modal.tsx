import React, { useEffect, useState } from 'react';
import '../../styles/Modal.scss';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  animationType?: 'fade' | 'slide' | 'zoom';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
  animationType = 'fade'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  if (!isOpen && !isVisible) return null;
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };
  
  return (
    <div 
      className={`modal-backdrop ${isOpen ? 'modal-backdrop--visible' : 'modal-backdrop--hidden'}`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`modal modal--${animationType} ${isOpen ? 'modal--visible' : 'modal--hidden'} ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="modal__header">
            {title && <h2 className="modal__title">{title}</h2>}
            {showCloseButton && (
              <button className="modal__close" onClick={onClose}>
                ✕
              </button>
            )}
          </div>
        )}
        <div className="modal__content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
