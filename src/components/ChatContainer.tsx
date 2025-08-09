import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { SEND_MESSAGE } from '../graphql/mutations'
import type { ChatMessage as ChatMessageType } from '../types/chat'
import './ChatContainer.css'

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    // 添加 loading 消息
    const loadingMessage: ChatMessageType = {
      id: 'loading',
      content: '正在思考中...',
      role: 'assistant',
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      // 发送到后端
      const { data } = await sendMessage({
        variables: { content }
      })

      // 移除 loading 消息并添加 AI 回复
      setMessages(prev => prev.filter(msg => msg.id !== 'loading'))

      if (data?.sendMessage) {
        const assistantMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          content: data.sendMessage,
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('发送消息失败:', error)

      // 移除 loading 消息
      setMessages(prev => prev.filter(msg => msg.id !== 'loading'))

      // 模拟 AI 回复（当后端不可用时）
      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，我现在无法连接到服务器。这是一个模拟回复，请确保后端服务正在运行。',
        role: 'assistant',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    }
  }

  return (
    <div className='chat-container'>
      <header className='chat-header'>
        <h1>AI 聊天助手</h1>
        <p>基于 GraphQL 的智能对话系统</p>
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

      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
    </div>
  )
}
