import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useSystem } from './hooks/system'

const httpLink = createHttpLink({
  // uri: 'https://api.ropescore.com'
  uri: 'http://localhost:5000'
})

const system = useSystem()

const authLink = setContext(async (_, { headers }) => {
  const token = system.value.rsApiToken
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  }
})

export const cache = new InMemoryCache({
  possibleTypes: {
    Scoresheet: ['TallyScoresheet', 'MarkScoresheet']
  },
  typePolicies: {
    Group: {
      fields: {
        entries: {
          merge: false
        },
        admins: {
          merge: false
        },
        viewers: {
          merge: false
        },
        categories: {
          merge: false
        }
      }
    }
  }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache
})
