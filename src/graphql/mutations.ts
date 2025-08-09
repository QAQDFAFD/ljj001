import { gql } from '@apollo/client'

export const SEND_MESSAGE = gql`
  mutation SendMessage($content: String!) {
    sendMessage(content: $content)
  }
`
