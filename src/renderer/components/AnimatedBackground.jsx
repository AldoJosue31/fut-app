// src/renderer/components/AnimatedBackground.jsx
import React from 'react'
import '../styles/AnimatedBackground.css'

export default function AnimatedBackground() {
  return (
    <div className="bg-anim-container">
      {/* 10 bolas de fútbol (puedes duplicar/ajustar) */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className={`ball ball-${i + 1}`}>
          <svg viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="28" stroke="#ffffff33" strokeWidth="4" fill="none" />
            {/* Aquí podrías poner más detalles de pentágonos, simplificado */}
          </svg>
        </div>
      ))}
    </div>
  )
}
