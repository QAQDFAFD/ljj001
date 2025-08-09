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

  // 新增：通过 GraphQL mutation 启动流，随后使用 EventSource 接收增量
  const startGraphQLSSEStream = useCallback(
    async (mutation: DocumentNode, variables: Record<string, unknown>, options: StreamingOptions) => {
      const { onChunk, onComplete, onError } = options

      try {
        const result = await client.mutate<{ startStream?: { streamId: string; sseEndpoint: string } }>({
          mutation,
          variables
        })

        const sseEndpoint = result.data?.startStream?.sseEndpoint
        if (!sseEndpoint) {
          throw new Error('Missing sseEndpoint from startStream response')
        }

        await new Promise<void>((resolve, reject) => {
          const eventSource = new EventSource(sseEndpoint)

          const handleError = (err?: unknown) => {
            try {
              eventSource.close()
            } catch (closeErr) {
              console.debug('SSE close error (handleError):', closeErr)
            }
            const error = err instanceof Error ? err : new Error('SSE connection error')
            onError(error)
            reject(error)
          }

          // 可选：连接事件
          eventSource.addEventListener('connected', () => {
            console.debug('SSE connected')
          })

          // 核心：增量事件
          eventSource.addEventListener('delta', (evt: MessageEvent) => {
            try {
              const data = JSON.parse(evt.data)
              const delta: string = data?.delta ?? ''
              const content: string = data?.content ?? ''
              if (delta) {
                onChunk(delta)
              } else if (content) {
                onChunk(content)
              }
            } catch {
              if (evt.data) onChunk(String(evt.data))
            }
          })

          // 兼容：服务端如果不分事件类型，走默认 message
          eventSource.onmessage = (evt: MessageEvent) => {
            try {
              const data = JSON.parse(evt.data)
              const delta: string = data?.delta ?? ''
              const content: string = data?.content ?? ''
              if (delta) {
                onChunk(delta)
              } else if (content) {
                onChunk(content)
              }
            } catch {
              if (evt.data) onChunk(String(evt.data))
            }
          }

          // 完成事件
          eventSource.addEventListener('done', () => {
            try {
              eventSource.close()
            } catch (closeErr) {
              console.debug('SSE close error (done):', closeErr)
            }
            onComplete()
            resolve()
          })

          // 错误事件（来自服务器）
          eventSource.addEventListener('error', (evt: MessageEvent) => {
            try {
              const data = JSON.parse(evt.data)
              handleError(new Error(data?.message || 'SSE server error'))
            } catch {
              handleError(new Error('SSE server error'))
            }
          })

          // 网络/连接错误
          eventSource.onerror = () => handleError()
        })
      } catch (error) {
        onError(error as Error)
      }
    },
    [client]
  )

  return { startGraphQLSSEStream }
}
