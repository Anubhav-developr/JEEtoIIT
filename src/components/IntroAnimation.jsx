import React, { useState, useEffect } from 'react';

export default function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState('namaste'); // namaste -> open -> reveal

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('open'), 2000);
    const timer2 = setTimeout(() => setPhase('reveal'), 3500);
    const timer3 = setTimeout(() => onComplete(), 5000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-950 font-sans">
      {/* Left Door */}
      <div className={`absolute top-0 left-0 w-1/2 h-full bg-slate-900 border-r border-slate-800 transition-transform duration-1000 ease-in-out z-10 ${phase === 'reveal' ? '-translate-x-full' : 'translate-x-0'}`}></div>
      {/* Right Door */}
      <div className={`absolute top-0 right-0 w-1/2 h-full bg-slate-900 border-l border-slate-800 transition-transform duration-1000 ease-in-out z-10 ${phase === 'reveal' ? 'translate-x-full' : 'translate-x-0'}`}></div>

      {/* Character Wrapper */}
      <div className={`relative z-20 flex flex-col items-center justify-center transition-opacity duration-700 ${phase === 'reveal' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="relative w-64 h-80 flex justify-center items-center">
          
          {/* Glowing Aura */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>

          <svg width="240" height="300" viewBox="0 0 240 300" className="relative z-10">
            {/* Body / Saree */}
            <path d="M 60 300 C 60 200, 80 160, 120 160 C 160 160, 180 200, 180 300 Z" fill="#4f46e5" />
            <path d="M 60 300 C 60 220, 140 180, 180 300 Z" fill="#4338ca" /> {/* Saree Pallu drape */}
            
            {/* Neck / Face base */}
            <rect x="110" y="110" width="20" height="30" fill="#d97757" rx="10"/>
            <circle cx="120" cy="90" r="35" fill="#e28c6e" />
            
            {/* Hair */}
            <path d="M 85 90 C 85 40, 155 40, 155 90 C 155 120, 145 130, 135 125 C 135 100, 105 100, 105 125 C 95 130, 85 120, 85 90 Z" fill="#1e1b4b" />
            <circle cx="120" cy="50" r="15" fill="#1e1b4b" /> {/* Bun */}
            
            {/* Bindi & Features */}
            <circle cx="120" cy="85" r="3" fill="#ef4444" />
            <path d="M 105 95 Q 112 100 119 95" stroke="#1e1b4b" strokeWidth="2" fill="none" /> {/* Left Eye closed */}
            <path d="M 121 95 Q 128 100 135 95" stroke="#1e1b4b" strokeWidth="2" fill="none" /> {/* Right Eye closed */}
            <path d="M 115 110 Q 120 115 125 110" stroke="#991b1b" strokeWidth="2" fill="none" /> {/* Smile */}
            
            {/* Jewelry */}
            <path d="M 100 140 Q 120 160 140 140" stroke="#fbbf24" strokeWidth="3" fill="none" />
            <circle cx="85" cy="100" r="4" fill="#fbbf24" />
            <circle cx="155" cy="100" r="4" fill="#fbbf24" />

            {/* Arms Container (Dynamic based on phase) */}
            <g className={`transition-all duration-1000 ease-in-out ${phase === 'open' ? 'opacity-100' : 'opacity-100'}`} style={{ transformOrigin: '120px 160px' }}>
              
              {/* LEFT ARM */}
              <g style={{ 
                  transform: phase === 'open' ? 'rotate(-60deg) translate(-20px, 10px)' : 'rotate(0deg)',
                  transformOrigin: '90px 160px',
                  transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                  {/* Sleeve */}
                  <path d="M 80 160 Q 60 180 70 210 L 95 210 Q 100 180 95 160 Z" fill="#312e81" />
                  {/* Forearm & Hand */}
                  <path d="M 70 210 Q 80 260 110 240 L 115 220 Q 90 230 95 210 Z" fill="#e28c6e" />
              </g>

              {/* RIGHT ARM */}
              <g style={{ 
                  transform: phase === 'open' ? 'rotate(60deg) translate(20px, 10px)' : 'rotate(0deg)',
                  transformOrigin: '150px 160px',
                  transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                  {/* Sleeve */}
                  <path d="M 160 160 Q 180 180 170 210 L 145 210 Q 140 180 145 160 Z" fill="#312e81" />
                  {/* Forearm & Hand */}
                  <path d="M 170 210 Q 160 260 130 240 L 125 220 Q 150 230 145 210 Z" fill="#e28c6e" />
              </g>
              
              {/* Namaste Hands Overlay (Fades out when opening) */}
              <g style={{ 
                  opacity: phase === 'open' ? 0 : 1,
                  transition: 'opacity 0.3s ease-in-out'
              }}>
                  <path d="M 115 230 L 120 200 L 125 230 Z" fill="#e28c6e" />
              </g>

            </g>
          </svg>
        </div>
        
        <div className="mt-8 text-center">
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            NAMASTE
          </h1>
          <p className={`text-indigo-200 mt-2 text-sm transition-opacity duration-1000 ${phase === 'open' ? 'opacity-100' : 'opacity-0'}`}>
            Welcome to Saumya's Portal
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Sidebar Navigation Component ---
