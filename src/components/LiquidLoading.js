import React, { useEffect, useState } from 'react';
import '../styles/LiquidLoading.css';

const LiquidLoading = () => {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationComplete(true);
    }, 2000); // Changed to 2 seconds

    return () => {
      clearTimeout(timer);
      setIsAnimationComplete(false);
    };
  }, []);

  return (
    <div className="liquid-loading-container">
      <div className={`liquid-wave ${isAnimationComplete ? 'animation-complete' : ''}`}></div>
      <div className={`liquid-wave wave2 ${isAnimationComplete ? 'animation-complete' : ''}`}></div>
    </div>
  );
};

export default LiquidLoading;