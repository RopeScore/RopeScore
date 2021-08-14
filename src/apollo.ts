import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useLocalStorage } from '@vueuse/core'

const httpLink = createHttpLink({
  uri: 'https://api.ropescore.app'
})

const authLink = setContext(async (_, { headers }) => {
  const token = useLocalStorage('ropescore-api-token', null)
  return {
    headers: {
      ...headers,
      authorization: token.value ? `Bearer ${token.value}` : ''
    }
  }
})

const cache = new InMemoryCache()

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache
})
