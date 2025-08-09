import ReactMarkdown from 'react-markdown'
import type { ChatMessage as ChatMessageType } from '../types/chat'
import './ChatMessage.css'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isLoading = message.id === 'loading'
  const isWaitingForFirstChunk = message.role === 'assistant' && message.content === ''

  return (
    <div className={`chat-message ${message.role} ${isLoading || isWaitingForFirstChunk ? 'loading' : ''}`}>
      <div className='message-avatar'>{message.role === 'user' ? '👤' : '🤖'}</div>
      <div className='message-content'>
        <div className={`message-text ${isLoading || isWaitingForFirstChunk ? 'typing' : ''}`}>
          {isLoading ? (
            <span className='loading-container'>
              <span className='loading-spinner'></span>
              正在思考中...
            </span>
          ) : isWaitingForFirstChunk ? (
            <span className='waiting-dots'>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
        {!isLoading && !isWaitingForFirstChunk && (
          <div className='message-timestamp'>{new Date(message.timestamp).toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  )
}
