import React, { useEffect, useRef } from 'react';

export default function RobotLoader({ label = 'Cargando...', className = '', scale = 1, full = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMove = (event) => {
      const target = containerRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (event.clientX - centerX) / rect.width;
      const dy = (event.clientY - centerY) / rect.height;
      const moveX = Math.max(-3, Math.min(3, dx * 8));
      const moveY = Math.max(-3, Math.min(3, dy * 8));
      target.style.setProperty('--eye-x', `${moveX}px`);
      target.style.setProperty('--eye-y', `${moveY}px`);
    };

    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`robot-loader ${full ? 'robot-loader--full' : ''} ${className}`.trim()}
      style={{ '--robot-scale': scale }}
    >
      <div className="robot">
        <div className="head">
          <div className="eyes">
            <span />
            <span />
          </div>
        </div>
        <div className="body">
          <span className="arm arm-left" />
          <span className="arm arm-right" />
          <div className="water" />
        </div>
      </div>
      {label && <div className="robot-loader__label">{label}</div>}
    </div>
  );
}
