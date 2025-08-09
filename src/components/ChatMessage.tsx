import type { ChatMessage as ChatMessageType } from '../types/chat'
import './ChatMessage.css'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isLoading = message.id === 'loading'

  return (
    <div className={`chat-message ${message.role} ${isLoading ? 'loading' : ''}`}>
      <div className='message-avatar'>{message.role === 'user' ? '👤' : '🤖'}</div>
      <div className='message-content'>
        <div className={`message-text ${isLoading ? 'typing' : ''}`}>
          {isLoading ? (
            <span className='loading-container'>
              <span className='loading-spinner'></span>
              正在思考中...
            </span>
          ) : (
            message.content
          )}
        </div>
        {!isLoading && <div className='message-timestamp'>{new Date(message.timestamp).toLocaleTimeString()}</div>}
      </div>
    </div>
  )
}
