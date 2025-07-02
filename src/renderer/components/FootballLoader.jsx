// src/renderer/components/FootballLoader.jsx
import React from 'react';
import '../styles/FootballLoader.css';

export default function FootballLoader() {
  return (
    <div className="football-loader-container">
      <svg
        className="football-loader"
        width="80"
        height="80"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" stroke="#F3F4F6" strokeWidth="5" fill="none" />
        {/* Caras pentagonales */}
        <polygon points="50,15 58,40 42,40  " fill="#F3F4F6" />
        <polygon points="50,85 58,60 42,60  " fill="#F3F4F6" />
        <polygon points="15,50 40,58 40,42  " fill="#F3F4F6" />
        <polygon points="85,50 60,58 60,42  " fill="#F3F4F6" />
        {/* Animación interna */}
        <circle cx="50" cy="50" r="10" fill="#16A34A" className="football-core" />
      </svg>
    </div>
);
}
