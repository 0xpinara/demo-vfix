import { useState, useEffect, useRef } from 'react'
import './AirConditioner.css'

function AirConditioner({ isPasswordFocused, passwordValue, showPassword }) {
  const acRef = useRef(null)
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })
  const [eyesClosed, setEyesClosed] = useState(false)
  const [isPeeking, setIsPeeking] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!acRef.current) return

      const rect = acRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const relX = (e.clientX - centerX) / (rect.width / 2)
      const relY = (e.clientY - centerY) / (rect.height / 2)

      const maxOffset = 5
      setEyePosition({
        x: Math.max(-maxOffset, Math.min(maxOffset, relX * maxOffset)),
        y: Math.max(-maxOffset, Math.min(maxOffset, relY * maxOffset))
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (showPassword) {
      setEyesClosed(false)
      setIsPeeking(true)
    } else {
      setEyesClosed(isPasswordFocused && passwordValue.length > 0)
      setIsPeeking(false)
    }
  }, [isPasswordFocused, passwordValue, showPassword])

  return (
    <div className="ac-container" ref={acRef}>
      <svg className="ac-svg" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="acGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5f7fa" />
            <stop offset="50%" stopColor="#e8ecf0" />
            <stop offset="100%" stopColor="#dde2e7" />
          </linearGradient>
          <linearGradient id="acFrontGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f3f6" />
          </linearGradient>
          <filter id="softShadowAC">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect x="10" y="15" width="140" height="55" rx="10" ry="10" 
              fill="url(#acGradient)" stroke="#c8d1d9" strokeWidth="2.5" filter="url(#softShadowAC)"/>
        
        <rect x="15" y="18" width="130" height="48" rx="7" ry="7" 
              fill="url(#acFrontGradient)" stroke="#b8c4ce" strokeWidth="2"/>
        
        <line x1="20" y1="25" x2="140" y2="25" stroke="#c0ced8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        
        <rect x="20" y="28" width="120" height="30" rx="5" ry="5" 
              fill="#f8fafc" opacity="0.3" stroke="#c0ced8" strokeWidth="1" strokeDasharray="2,2"/>
        
        <circle cx="30" cy="35" r="2" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="50" cy="35" r="2" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="70" cy="35" r="2" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="90" cy="35" r="2" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="110" cy="35" r="2" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="130" cy="35" r="2" fill="#8a9ba8" opacity="0.6"/>
        
        <g className="eye-container">
          <g transform="translate(50, 38)">
            <ellipse className={`eye ${eyesClosed ? 'closed' : ''} ${isPeeking ? 'peeking' : ''}`} 
                     cx="0" cy="0" rx="9" ry={eyesClosed ? 1 : (isPeeking ? 4.5 : 9)} 
                     fill="#ffffff" stroke="#b8c4ce" strokeWidth="2"/>
            {!eyesClosed && [
              <circle key="p1" className="eye-pupil" cx={eyePosition.x} cy={eyePosition.y} r="4.5" fill="#4a5568"/>,
              <circle key="p2" className="eye-pupil" cx={eyePosition.x * 0.7} cy={eyePosition.y * 0.7} r="2.2" fill="#2d3748"/>,
              <circle key="p3" className="eye-pupil" cx={eyePosition.x * 0.5} cy={eyePosition.y * 0.5} r="1.1" fill="#ffffff" opacity="0.8"/>
            ]}
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -9,-4.5 Q 0,-6 9,-4.5 L 9,0 Q 0,1.5 -9,0 Z"
                  strokeWidth="1.5"/>
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -9,0 Q 0,1.5 9,0 L 9,4.5 Q 0,6 -9,4.5 Z"
                  strokeWidth="1.5"/>
          </g>
          <g transform="translate(110, 38)">
            <ellipse className={`eye ${eyesClosed ? 'closed' : ''} ${isPeeking ? 'peeking' : ''}`} 
                     cx="0" cy="0" rx="9" ry={eyesClosed ? 1 : (isPeeking ? 4.5 : 9)} 
                     fill="#ffffff" stroke="#b8c4ce" strokeWidth="2"/>
            {!eyesClosed && [
              <circle key="p4" className="eye-pupil" cx={eyePosition.x} cy={eyePosition.y} r="4.5" fill="#4a5568"/>,
              <circle key="p5" className="eye-pupil" cx={eyePosition.x * 0.7} cy={eyePosition.y * 0.7} r="2.2" fill="#2d3748"/>,
              <circle key="p6" className="eye-pupil" cx={eyePosition.x * 0.5} cy={eyePosition.y * 0.5} r="1.1" fill="#ffffff" opacity="0.8"/>
            ]}
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -9,-4.5 Q 0,-6 9,-4.5 L 9,0 Q 0,1.5 -9,0 Z"
                  strokeWidth="1.5"/>
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -9,0 Q 0,1.5 9,0 L 9,4.5 Q 0,6 -9,4.5 Z"
                  strokeWidth="1.5"/>
          </g>
        </g>
        
        <ellipse cx="40" cy="42" rx="4" ry="2.5" fill="#ffb3d1" opacity="0.35"/>
        <ellipse cx="120" cy="42" rx="4" ry="2.5" fill="#ffb3d1" opacity="0.35"/>
        
        <rect x="25" y="58" width="110" height="8" rx="3" ry="3" 
              fill="#e0e8f0" opacity="0.6" stroke="#b8c4ce" strokeWidth="1"/>
        <line x1="30" y1="61" x2="145" y2="61" stroke="#8a9ba8" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="30" y1="63" x2="145" y2="63" stroke="#8a9ba8" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="30" y1="65" x2="145" y2="65" stroke="#8a9ba8" strokeWidth="1.5" strokeLinecap="round"/>
        
        <g className="air-particles" transform="translate(80, 50)">
          <ellipse className="air-particle" cx="0" cy="0" rx="5" ry="8"/>
          <ellipse className="air-particle" cx="0" cy="-8" rx="6" ry="9"/>
          <ellipse className="air-particle" cx="0" cy="8" rx="6" ry="9"/>
          <ellipse className="air-particle" cx="0" cy="-15" rx="7" ry="10"/>
          <ellipse className="air-particle" cx="0" cy="15" rx="7" ry="10"/>
          <ellipse className="air-particle" cx="0" cy="-22" rx="8" ry="11"/>
        </g>
        
        <g className="snow-crystals" transform="translate(80, 50)">
          <g className="snow-crystal" transform="translate(0, 0)">
            <path d="M 0,-3 L 1,-1 L 3,-1 L 1.5,0.5 L 2,2.5 L 0,1.5 L -2,2.5 L -1.5,0.5 L -3,-1 L -1,-1 Z"/>
          </g>
          <g className="snow-crystal" transform="translate(0, -10)">
            <path d="M 0,-2.5 L 0.8,-0.8 L 2.5,-0.8 L 1.2,0.4 L 1.6,2 L 0,1.2 L -1.6,2 L -1.2,0.4 L -2.5,-0.8 L -0.8,-0.8 Z"/>
          </g>
          <g className="snow-crystal" transform="translate(0, 10)">
            <path d="M 0,-2.5 L 0.8,-0.8 L 2.5,-0.8 L 1.2,0.4 L 1.6,2 L 0,1.2 L -1.6,2 L -1.2,0.4 L -2.5,-0.8 L -0.8,-0.8 Z"/>
          </g>
          <g className="snow-crystal" transform="translate(0, -18)">
            <path d="M 0,-2 L 0.6,-0.6 L 2,-0.6 L 1,0.3 L 1.3,1.6 L 0,1 L -1.3,1.6 L -1,0.3 L -2,-0.6 L -0.6,-0.6 Z"/>
          </g>
          <g className="snow-crystal" transform="translate(0, 18)">
            <path d="M 0,-2 L 0.6,-0.6 L 2,-0.6 L 1,0.3 L 1.3,1.6 L 0,1 L -1.3,1.6 L -1,0.3 L -2,-0.6 L -0.6,-0.6 Z"/>
          </g>
        </g>
      </svg>
    </div>
  )
}

export default AirConditioner

