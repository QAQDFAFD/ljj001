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
