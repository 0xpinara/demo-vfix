import { useState, useEffect, useRef } from 'react'
import './Appliances.css'

function Appliance({ type, isPasswordFocused, passwordValue, showPassword, isPeeker, hasError }) {
  const applianceRef = useRef(null)
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })
  const [eyesClosed, setEyesClosed] = useState(false)
  const [isPeeking, setIsPeeking] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!applianceRef.current) return

      const rect = applianceRef.current.getBoundingClientRect()
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
      setEyesClosed(true)
      if (isPeeker) {
        setIsPeeking(true)
        setEyesClosed(false)
      } else {
        setIsPeeking(false)
      }
    } else {
      setEyesClosed(isPasswordFocused && passwordValue.length > 0)
      setIsPeeking(false)
    }
  }, [isPasswordFocused, passwordValue, showPassword, isPeeker])

  const renderFridge = () => {
    const smokeY = 15
    const smokeX = 60
    return (
      <svg className="appliance-svg" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fridgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5f7fa" />
            <stop offset="50%" stopColor="#e8ecf0" />
            <stop offset="100%" stopColor="#dde2e7" />
          </linearGradient>
          <linearGradient id="doorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f3f6" />
          </linearGradient>
          <filter id="softShadow">
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
        <rect x="10" y="15" width="100" height="130" rx="14" ry="14" 
              fill="url(#fridgeGradient)" stroke="#c8d1d9" strokeWidth="2.5" filter="url(#softShadow)"/>
        <rect x="15" y="20" width="90" height="120" rx="10" ry="10" 
              fill="url(#doorGradient)" stroke="#b8c4ce" strokeWidth="2"/>
        <rect x="18" y="22" width="84" height="38" rx="8" ry="8" 
              fill="#e0e8f0" opacity="0.6" stroke="#a8b5c0" strokeWidth="1.5" strokeDasharray="3,2"/>
        <line x1="20" y1="70" x2="100" y2="70" stroke="#c0ced8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <line x1="20" y1="105" x2="100" y2="105" stroke="#c0ced8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <ellipse cx="95" cy="80" rx="5" ry="15" fill="#a8b5c0" opacity="0.7"/>
        <ellipse cx="95" cy="80" rx="3" ry="10" fill="#8a9ba8"/>
        <rect x="20" y="110" width="75" height="25" rx="6" ry="6" 
              fill="#e8f0f8" opacity="0.5" stroke="#b8c4ce" strokeWidth="1.5" strokeDasharray="4,3"/>
        <g className="eye-container">
          <g transform="translate(40, 55)">
            <ellipse className={`eye ${eyesClosed ? 'closed' : ''} ${isPeeking ? 'peeking' : ''}`} 
                     cx="0" cy="0" rx="12" ry={eyesClosed ? 1 : (isPeeking ? 6 : 12)} 
                     fill="#ffffff" stroke="#b8c4ce" strokeWidth="2"/>
            {!eyesClosed && [
              <circle key="p1" className="eye-pupil" cx={eyePosition.x} cy={eyePosition.y} r="6" fill="#4a5568"/>,
              <circle key="p2" className="eye-pupil" cx={eyePosition.x * 0.7} cy={eyePosition.y * 0.7} r="3" fill="#2d3748"/>,
              <circle key="p3" className="eye-pupil" cx={eyePosition.x * 0.5} cy={eyePosition.y * 0.5} r="1.5" fill="#ffffff" opacity="0.8"/>
            ]}
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,-6 Q 0,-8 12,-6 L 12,0 Q 0,2 -12,0 Z"
                  strokeWidth="1.5"/>
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,0 Q 0,2 12,0 L 12,6 Q 0,8 -12,6 Z"
                  strokeWidth="1.5"/>
          </g>
          <g transform="translate(80, 55)">
            <ellipse className={`eye ${eyesClosed ? 'closed' : ''} ${isPeeking ? 'peeking' : ''}`} 
                     cx="0" cy="0" rx="12" ry={eyesClosed ? 1 : (isPeeking ? 6 : 12)} 
                     fill="#ffffff" stroke="#b8c4ce" strokeWidth="2"/>
            {!eyesClosed && [
              <circle key="p4" className="eye-pupil" cx={eyePosition.x} cy={eyePosition.y} r="6" fill="#4a5568"/>,
              <circle key="p5" className="eye-pupil" cx={eyePosition.x * 0.7} cy={eyePosition.y * 0.7} r="3" fill="#2d3748"/>,
              <circle key="p6" className="eye-pupil" cx={eyePosition.x * 0.5} cy={eyePosition.y * 0.5} r="1.5" fill="#ffffff" opacity="0.8"/>
            ]}
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,-6 Q 0,-8 12,-6 L 12,0 Q 0,2 -12,0 Z"
                  strokeWidth="1.5"/>
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,0 Q 0,2 12,0 L 12,6 Q 0,8 -12,6 Z"
                  strokeWidth="1.5"/>
          </g>
        </g>
        <ellipse cx="28" cy="75" rx="6" ry="4" fill="#ffb3d1" opacity="0.35"/>
        <ellipse cx="92" cy="75" rx="6" ry="4" fill="#ffb3d1" opacity="0.35"/>
        {hasError && (
          <g className={`smoke ${hasError ? 'active' : ''}`} transform={`translate(${smokeX}, ${smokeY})`}>
            <ellipse className="smoke-particle" cx="0" cy="0" rx="4" ry="6"/>
            <ellipse className="smoke-particle" cx="-8" cy="-5" rx="5" ry="7"/>
            <ellipse className="smoke-particle" cx="8" cy="-5" rx="5" ry="7"/>
            <ellipse className="smoke-particle" cx="-5" cy="-12" rx="6" ry="8"/>
            <ellipse className="smoke-particle" cx="5" cy="-12" rx="6" ry="8"/>
          </g>
        )}
      </svg>
    )
  }

  const renderLaundry = () => {
    const smokeY = 20
    const smokeX = 60
    return (
      <svg className="appliance-svg" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="laundryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5f7fa" />
            <stop offset="50%" stopColor="#e8ecf0" />
            <stop offset="100%" stopColor="#dde2e7" />
          </linearGradient>
          <linearGradient id="laundryDoorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f3f6" />
          </linearGradient>
          <filter id="softShadow2">
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
        <rect x="10" y="15" width="100" height="130" rx="14" ry="14" 
              fill="url(#laundryGradient)" stroke="#c8d1d9" strokeWidth="2.5" filter="url(#softShadow2)"/>
        <rect x="15" y="20" width="90" height="30" rx="6" ry="6" 
              fill="#e0e8f0" opacity="0.7" stroke="#a8b5c0" strokeWidth="1.5"/>
        <circle cx="30" cy="35" r="3" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="45" cy="35" r="3" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="60" cy="35" r="3" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="75" cy="35" r="3" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="90" cy="35" r="3" fill="#8a9ba8" opacity="0.6"/>
        <circle cx="60" cy="85" r="38" fill="url(#laundryDoorGradient)" stroke="#b8c4ce" strokeWidth="2"/>
        <circle cx="60" cy="85" r="32" fill="#e8f0f8" opacity="0.4" stroke="#c0ced8" strokeWidth="1.5" strokeDasharray="3,2"/>
        <circle cx="60" cy="85" r="24" fill="#ffffff" opacity="0.6"/>
        <circle cx="60" cy="85" r="18" fill="#d0e0f0" opacity="0.3"/>
        <circle cx="60" cy="85" r="12" fill="#ffffff" opacity="0.4"/>
        <g className="eye-container">
          <g transform="translate(40, 55)">
            <ellipse className={`eye ${eyesClosed ? 'closed' : ''} ${isPeeking ? 'peeking' : ''}`} 
                     cx="0" cy="0" rx="12" ry={eyesClosed ? 1 : (isPeeking ? 6 : 12)} 
                     fill="#ffffff" stroke="#b8c4ce" strokeWidth="2"/>
            {!eyesClosed && [
              <circle key="p1" className="eye-pupil" cx={eyePosition.x} cy={eyePosition.y} r="6" fill="#4a5568"/>,
              <circle key="p2" className="eye-pupil" cx={eyePosition.x * 0.7} cy={eyePosition.y * 0.7} r="3" fill="#2d3748"/>,
              <circle key="p3" className="eye-pupil" cx={eyePosition.x * 0.5} cy={eyePosition.y * 0.5} r="1.5" fill="#ffffff" opacity="0.8"/>
            ]}
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,-6 Q 0,-8 12,-6 L 12,0 Q 0,2 -12,0 Z"
                  strokeWidth="1.5"/>
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,0 Q 0,2 12,0 L 12,6 Q 0,8 -12,6 Z"
                  strokeWidth="1.5"/>
          </g>
          <g transform="translate(80, 55)">
            <ellipse className={`eye ${eyesClosed ? 'closed' : ''} ${isPeeking ? 'peeking' : ''}`} 
                     cx="0" cy="0" rx="12" ry={eyesClosed ? 1 : (isPeeking ? 6 : 12)} 
                     fill="#ffffff" stroke="#b8c4ce" strokeWidth="2"/>
            {!eyesClosed && [
              <circle key="p4" className="eye-pupil" cx={eyePosition.x} cy={eyePosition.y} r="6" fill="#4a5568"/>,
              <circle key="p5" className="eye-pupil" cx={eyePosition.x * 0.7} cy={eyePosition.y * 0.7} r="3" fill="#2d3748"/>,
              <circle key="p6" className="eye-pupil" cx={eyePosition.x * 0.5} cy={eyePosition.y * 0.5} r="1.5" fill="#ffffff" opacity="0.8"/>
            ]}
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,-6 Q 0,-8 12,-6 L 12,0 Q 0,2 -12,0 Z"
                  strokeWidth="1.5"/>
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,0 Q 0,2 12,0 L 12,6 Q 0,8 -12,6 Z"
                  strokeWidth="1.5"/>
          </g>
        </g>
        <ellipse cx="28" cy="75" rx="6" ry="4" fill="#ffb3d1" opacity="0.35"/>
        <ellipse cx="92" cy="75" rx="6" ry="4" fill="#ffb3d1" opacity="0.35"/>
        <rect x="20" y="120" width="80" height="20" rx="5" ry="5" 
              fill="#e8f0f8" opacity="0.4" stroke="#b8c4ce" strokeWidth="1.5" strokeDasharray="4,3"/>
        {hasError && (
          <g className={`smoke ${hasError ? 'active' : ''}`} transform={`translate(${smokeX}, ${smokeY})`}>
            <ellipse className="smoke-particle" cx="0" cy="0" rx="4" ry="6"/>
            <ellipse className="smoke-particle" cx="-8" cy="-5" rx="5" ry="7"/>
            <ellipse className="smoke-particle" cx="8" cy="-5" rx="5" ry="7"/>
            <ellipse className="smoke-particle" cx="-5" cy="-12" rx="6" ry="8"/>
            <ellipse className="smoke-particle" cx="5" cy="-12" rx="6" ry="8"/>
          </g>
        )}
      </svg>
    )
  }

  const renderOven = () => {
    const smokeY = 15
    const smokeX = 60
    return (
      <svg className="appliance-svg" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ovenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5f7fa" />
            <stop offset="50%" stopColor="#e8ecf0" />
            <stop offset="100%" stopColor="#dde2e7" />
          </linearGradient>
          <linearGradient id="ovenDoorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f3f6" />
          </linearGradient>
          <filter id="softShadow3">
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
        <rect x="10" y="15" width="100" height="130" rx="14" ry="14" 
              fill="url(#ovenGradient)" stroke="#c8d1d9" strokeWidth="2.5" filter="url(#softShadow3)"/>
        <rect x="15" y="20" width="90" height="30" rx="6" ry="6" 
              fill="#e0e8f0" opacity="0.7" stroke="#a8b5c0" strokeWidth="1.5"/>
        <circle cx="30" cy="35" r="4" fill="#8a9ba8" opacity="0.7"/>
        <circle cx="30" cy="35" r="2.5" fill="#6a7a8a"/>
        <circle cx="60" cy="35" r="4" fill="#8a9ba8" opacity="0.7"/>
        <circle cx="60" cy="35" r="2.5" fill="#6a7a8a"/>
        <circle cx="90" cy="35" r="4" fill="#8a9ba8" opacity="0.7"/>
        <circle cx="90" cy="35" r="2.5" fill="#6a7a8a"/>
        <rect x="20" y="55" width="80" height="85" rx="8" ry="8" 
              fill="url(#ovenDoorGradient)" stroke="#b8c4ce" strokeWidth="2"/>
        <rect x="25" y="60" width="70" height="75" rx="6" ry="6" 
              fill="#f8fafc" opacity="0.5" stroke="#c0ced8" strokeWidth="1.5" strokeDasharray="3,2"/>
        <rect x="30" y="65" width="60" height="45" rx="4" ry="4" 
              fill="#ffffff" opacity="0.3" stroke="#a8b5c0" strokeWidth="1"/>
        <line x1="35" y1="85" x2="85" y2="85" stroke="#c0ced8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <line x1="35" y1="100" x2="85" y2="100" stroke="#c0ced8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <ellipse cx="95" cy="80" rx="4" ry="10" fill="#a8b5c0" opacity="0.7"/>
        <ellipse cx="95" cy="80" rx="2.5" ry="7" fill="#8a9ba8"/>
        <g className="eye-container">
          <g transform="translate(40, 55)">
            <ellipse className={`eye ${eyesClosed ? 'closed' : ''} ${isPeeking ? 'peeking' : ''}`} 
                     cx="0" cy="0" rx="12" ry={eyesClosed ? 1 : (isPeeking ? 6 : 12)} 
                     fill="#ffffff" stroke="#b8c4ce" strokeWidth="2"/>
            {!eyesClosed && [
              <circle key="p1" className="eye-pupil" cx={eyePosition.x} cy={eyePosition.y} r="6" fill="#4a5568"/>,
              <circle key="p2" className="eye-pupil" cx={eyePosition.x * 0.7} cy={eyePosition.y * 0.7} r="3" fill="#2d3748"/>,
              <circle key="p3" className="eye-pupil" cx={eyePosition.x * 0.5} cy={eyePosition.y * 0.5} r="1.5" fill="#ffffff" opacity="0.8"/>
            ]}
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,-6 Q 0,-8 12,-6 L 12,0 Q 0,2 -12,0 Z"
                  strokeWidth="1.5"/>
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,0 Q 0,2 12,0 L 12,6 Q 0,8 -12,6 Z"
                  strokeWidth="1.5"/>
          </g>
          <g transform="translate(80, 55)">
            <ellipse className={`eye ${eyesClosed ? 'closed' : ''} ${isPeeking ? 'peeking' : ''}`} 
                     cx="0" cy="0" rx="12" ry={eyesClosed ? 1 : (isPeeking ? 6 : 12)} 
                     fill="#ffffff" stroke="#b8c4ce" strokeWidth="2"/>
            {!eyesClosed && [
              <circle key="p4" className="eye-pupil" cx={eyePosition.x} cy={eyePosition.y} r="6" fill="#4a5568"/>,
              <circle key="p5" className="eye-pupil" cx={eyePosition.x * 0.7} cy={eyePosition.y * 0.7} r="3" fill="#2d3748"/>,
              <circle key="p6" className="eye-pupil" cx={eyePosition.x * 0.5} cy={eyePosition.y * 0.5} r="1.5" fill="#ffffff" opacity="0.8"/>
            ]}
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,-6 Q 0,-8 12,-6 L 12,0 Q 0,2 -12,0 Z"
                  strokeWidth="1.5"/>
            <path className={`eyelid eyelid-top ${eyesClosed ? 'visible' : ''}`} 
                  d="M -12,0 Q 0,2 12,0 L 12,6 Q 0,8 -12,6 Z"
                  strokeWidth="1.5"/>
          </g>
        </g>
        <ellipse cx="28" cy="75" rx="6" ry="4" fill="#ffb3d1" opacity="0.35"/>
        <ellipse cx="92" cy="75" rx="6" ry="4" fill="#ffb3d1" opacity="0.35"/>
        <rect x="25" y="115" width="70" height="20" rx="5" ry="5" 
              fill="#e8f0f8" opacity="0.4" stroke="#b8c4ce" strokeWidth="1.5" strokeDasharray="4,3"/>
        {hasError && (
          <g className={`smoke ${hasError ? 'active' : ''}`} transform={`translate(${smokeX}, ${smokeY})`}>
            <ellipse className="smoke-particle" cx="0" cy="0" rx="4" ry="6"/>
            <ellipse className="smoke-particle" cx="-8" cy="-5" rx="5" ry="7"/>
            <ellipse className="smoke-particle" cx="8" cy="-5" rx="5" ry="7"/>
            <ellipse className="smoke-particle" cx="-5" cy="-12" rx="6" ry="8"/>
            <ellipse className="smoke-particle" cx="5" cy="-12" rx="6" ry="8"/>
          </g>
        )}
      </svg>
    )
  }

  return (
    <div className="appliance-container" ref={applianceRef}>
      {type === 'fridge' && renderFridge()}
      {type === 'laundry' && renderLaundry()}
      {type === 'oven' && renderOven()}
    </div>
  )
}

function AppliancesGroup({ isPasswordFocused, passwordValue, showPassword, hasError }) {
  return (
    <div className="appliances-container">
      <Appliance type="fridge" isPasswordFocused={isPasswordFocused} passwordValue={passwordValue} showPassword={showPassword} isPeeker={false} hasError={hasError} />
      <Appliance type="laundry" isPasswordFocused={isPasswordFocused} passwordValue={passwordValue} showPassword={showPassword} isPeeker={true} hasError={hasError} />
      <Appliance type="oven" isPasswordFocused={isPasswordFocused} passwordValue={passwordValue} showPassword={showPassword} isPeeker={false} hasError={hasError} />
    </div>
  )
}

export default AppliancesGroup

