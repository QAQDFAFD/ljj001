import { gql } from '@apollo/client'

export const SEND_MESSAGE = gql`
  mutation SendMessage($content: String!) {
    sendMessage(content: $content)
  }
`

export const SEND_MESSAGE_STREAM = gql`
  mutation SendMessageStream($content: String!) {
    sendMessageStream(content: $content)
  }
`

// 新的：通过 GraphQL 启动流，返回 SSE 端点
export const START_STREAM = gql`
  mutation StartStream($content: String!) {
    startStream(content: $content) {
      streamId
      sseEndpoint
    }
  }
`
