import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

// 配置 GraphQL 端点
const httpLink = createHttpLink({
  uri: 'https://ljj001.xyz.your-username.workers.dev/graphql' // 替换为你的 GraphQL 端点
})

// 创建 Apollo Client 实例
export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all'
    },
    query: {
      errorPolicy: 'all'
    }
  }
})
