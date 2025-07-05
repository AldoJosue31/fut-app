// src/renderer/components/FootballLoader.jsx
import React from 'react';
import '../styles/FootballLoader.css';

export default function FootballLoader() {
  return (
    <div className="football-loader-container">
      <svg
        className="football-loader"
        width="120"
        height="120"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Exterior texturizado */}
        <defs>
          <radialGradient id="ball-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#ddd" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="55" fill="url(#ball-gradient)" stroke="#333" strokeWidth="2" />

        {/* Paneles hexagonales */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60) * (Math.PI/180);
          const x = 60 + Math.cos(angle) * 25;
          const y = 60 + Math.sin(angle) * 25;
          return (
            <polygon
              key={i}
              points={hexagonPoints(x, y, 15)}
              fill="#333"
              stroke="#111"
              strokeWidth="1"
            />
          )
        })}

        {/* Centro animado */}
        <circle cx="60" cy="60" r="12" fill="#16A34A" className="football-core" />
      </svg>
    </div>
  );
}

// Helper for hexagon point generation
function hexagonPoints(cx, cy, r) {
  let pts = [];
  for (let i = 0; i < 6; i++) {
    const theta = (Math.PI / 3) * i - Math.PI/6;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    pts.push(`${x},${y}`);
  }
  return pts.join(' ');
}
