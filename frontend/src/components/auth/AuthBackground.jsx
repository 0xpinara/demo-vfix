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
    </div>
  )
}

export default AuthBackground

