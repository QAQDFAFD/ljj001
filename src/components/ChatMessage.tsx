import type { ChatMessage as ChatMessageType } from '../types/chat'
import './ChatMessage.css'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`chat-message ${message.role}`}>
      <div className='message-avatar'>{message.role === 'user' ? '👤' : '🤖'}</div>
      <div className='message-content'>
        <div className='message-text'>{message.content}</div>
        <div className='message-timestamp'>{new Date(message.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  )
}
