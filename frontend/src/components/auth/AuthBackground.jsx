import StarsBackground from './StarsBackground'
import CloudsBackground from './CloudsBackground'
import ChatBubblesBackground from './ChatBubblesBackground'

function AuthBackground({ type = 'login' }) {
  return (
    <div className="auth-background">
      {type === 'login' && (
        <>
          <StarsBackground />
          <CloudsBackground />
        </>
      )}
      {type === 'register' && <ChatBubblesBackground />}
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>
    </div>
  )
}

export default AuthBackground

