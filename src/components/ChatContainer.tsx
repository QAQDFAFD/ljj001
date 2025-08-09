import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { START_STREAM } from '../graphql/mutations'
import { useStreamingGraphQL } from '../hooks/useStreamingGraphQL'
import type { ChatMessage as ChatMessageType } from '../types/chat'
import './ChatContainer.css'

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { startGraphQLSSEStream } = useStreamingGraphQL()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chunkBufferRef = useRef<string>('')
  const updateTimeoutRef = useRef<number | null>(null)
  const hasReceivedFirstChunkRef = useRef<boolean>(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    // 添加用户消息
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])

    // 添加loading状态的 AI 消息，准备接收流式内容
    const assistantMessageId = (Date.now() + 1).toString()
    const initialAssistantMessage: ChatMessageType = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, initialAssistantMessage])

    setIsLoading(true)
    hasReceivedFirstChunkRef.current = false // 重置首字符接收状态

    // 使用 GraphQL mutation 启动流 + SSE 接收
    await startGraphQLSSEStream(
      START_STREAM,
      { content },
      {
        onChunk: (chunk: string) => {
          // 调试信息
          console.log('Received chunk:', chunk)

          // 检查是否是第一个字符
          if (!hasReceivedFirstChunkRef.current) {
            console.log('First chunk received, hiding dots animation')
            hasReceivedFirstChunkRef.current = true
          }

          // 累积 chunks 到缓冲区
          chunkBufferRef.current += chunk

          // 清除之前的定时器
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }

          // 批量更新，减少渲染频率
          updateTimeoutRef.current = setTimeout(() => {
            const bufferedContent = chunkBufferRef.current
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId ? { ...msg, content: msg.content + bufferedContent } : msg
              )
            )
            chunkBufferRef.current = '' // 清空缓冲区
          }, 50) // 50ms 批量更新间隔
        },
        onComplete: () => {
          // 清除定时器并处理剩余缓冲区内容
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }

          // 处理最后的缓冲区内容
          if (chunkBufferRef.current) {
            const finalContent = chunkBufferRef.current
            setMessages(prev =>
              prev.map(msg => (msg.id === assistantMessageId ? { ...msg, content: msg.content + finalContent } : msg))
            )
            chunkBufferRef.current = ''
          }

          setIsLoading(false)
          hasReceivedFirstChunkRef.current = false // 重置状态
          console.log('Stream completed')
        },
        onError: (error: Error) => {
          console.error('发送消息失败:', error)
          setIsLoading(false)
          hasReceivedFirstChunkRef.current = false // 重置状态

          // 更新消息为错误内容
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId ? { ...msg, content: '抱歉，我现在无法连接到服务器。请稍后再试。' } : msg
            )
          )
        }
      }
    )
  }

  return (
    <div className='chat-container'>
      <header className='chat-header'>
        <h1>AI 聊天助手</h1>
        <p>基于 deepseek 的智能对话系统</p>
      </header>

      <div className='messages-container'>
        {messages.length === 0 ? (
          <div className='welcome-message'>
            <div className='welcome-icon'>🤖</div>
            <h2>欢迎使用 AI 聊天助手</h2>
            <p>你可以在下方输入任何问题，我会尽力为你解答</p>
          </div>
        ) : (
          messages.map(message => <ChatMessage key={message.id} message={message} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  )
}
