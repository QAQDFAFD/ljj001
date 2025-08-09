import { useCallback } from 'react'
import { useApolloClient } from '@apollo/client'
import type { DocumentNode } from '@apollo/client'

interface StreamingOptions {
  onChunk: (chunk: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

export function useStreamingGraphQL() {
  const client = useApolloClient()

  const executeStreamingMutation = useCallback(
    async (mutation: DocumentNode, variables: Record<string, unknown>, options: StreamingOptions) => {
      const { onChunk, onComplete, onError } = options

      try {
        // 获取 GraphQL 端点
        const link = client.link as { options?: { uri?: string } }
        const uri = link?.options?.uri || 'https://deepseek.qaqdfafd.workers.dev/graphql'

        // 构造 GraphQL 请求
        const body = {
          query: (mutation as { loc: { source: { body: string } } }).loc.source.body,
          variables
        }

        // 发起流式请求
        const response = await fetch(`${uri}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Response body is not readable')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) break

            // 累积数据到缓冲区
            buffer += decoder.decode(value, { stream: true })

            // 处理完整的行
            const lines = buffer.split('\n')
            // 保留最后一行（可能不完整）
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine === '') continue

              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim()

                if (data === '[DONE]') {
                  onComplete()
                  return
                }

                // 跳过空数据
                if (!data) continue

                try {
                  const parsed = JSON.parse(data)
                  let content = ''

                  // 支持多种数据格式
                  if (parsed.data?.sendMessageStream) {
                    content = parsed.data.sendMessageStream
                  } else if (parsed.content) {
                    content = parsed.content
                  } else if (typeof parsed === 'string') {
                    content = parsed
                  }

                  if (content) {
                    onChunk(content)
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e, 'Raw data:', data)
                  // 如果 JSON 解析失败，尝试直接使用数据
                  if (data && !data.startsWith('{') && !data.startsWith('[')) {
                    onChunk(data)
                  }
                }
              }
            }
          }

          onComplete()
        } finally {
          reader.releaseLock()
        }
      } catch (error) {
        onError(error as Error)
      }
    },
    [client]
  )

  return { executeStreamingMutation }
}
