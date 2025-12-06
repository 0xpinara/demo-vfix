import { useMemo } from 'react'
import './PasswordStrengthIndicator.css'

function PasswordStrengthIndicator({ password }) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' }

    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    }

    // Calculate score
    if (checks.length) score++
    if (checks.lowercase) score++
    if (checks.uppercase) score++
    if (checks.number) score++
    if (checks.special) score++

    // Determine strength level
    if (score <= 2) {
      return { level: 1, label: 'Zayıf', color: 'var(--error)', percentage: 25 }
    } else if (score === 3) {
      return { level: 2, label: 'Orta', color: '#f59e0b', percentage: 50 }
    } else if (score === 4) {
      return { level: 3, label: 'İyi', color: '#3b82f6', percentage: 75 }
    } else {
      return { level: 4, label: 'Güçlü', color: '#10b981', percentage: 100 }
    }
  }, [password])

  if (!password) return null

  return (
    <div className="password-strength">
      <div className="password-strength-bar">
        <div
          className="password-strength-fill"
          style={{
            width: `${strength.percentage}%`,
            backgroundColor: strength.color,
          }}
        />
      </div>
      <div className="password-strength-label" style={{ color: strength.color }}>
        {strength.label}
      </div>
    </div>
  )
}

export default PasswordStrengthIndicator

