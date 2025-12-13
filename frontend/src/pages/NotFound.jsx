import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <div className="not-found-container">
      <div className="scanlines"></div>
      
      <div className="not-found-content">
        <div className="error-label">Hata Kodu</div>
        <div className="error-code">404</div>
        
        <div className="status-row">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">Hata</span>
          </div>
          <div className="status-indicator">
            <span className="status-dot inactive"></span>
            <span className="status-text inactive">Bağlantı</span>
          </div>
          <div className="status-indicator">
            <span className="status-dot inactive"></span>
            <span className="status-text inactive">Sayfa</span>
          </div>
        </div>
        
        <a href="/homepage.html" className="btn-home">
          <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Ana Sayfa
        </a>
      </div>
    </div>
  )
}

export default NotFound

