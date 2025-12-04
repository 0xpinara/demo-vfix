import { useEffect, useRef } from 'react'
import './StarsBackground.css'

function StarsBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const numberOfStars = 100

    for (let i = 0; i < numberOfStars; i++) {
      const star = document.createElement('div')
      star.className = 'star'

      const size = Math.random()
      if (size < 0.6) {
        star.classList.add('small')
      } else if (size < 0.9) {
        star.classList.add('medium')
      } else {
        star.classList.add('large')
      }

      star.style.left = Math.random() * 100 + '%'
      star.style.top = Math.random() * 100 + '%'
      star.style.animationDelay = Math.random() * 3 + 's'

      container.appendChild(star)
    }

    return () => {
      container.innerHTML = ''
    }
  }, [])

  return <div className="stars-container" ref={containerRef}></div>
}

export default StarsBackground

