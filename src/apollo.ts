import { ApolloClient, createHttpLink, InMemoryCache, from } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'
import { ref } from 'vue'
import { useSystem } from './hooks/system'
import { v4 as uuid } from 'uuid'

const httpLink = createHttpLink({
  // uri: 'https://api.ropescore.com/graphql'
  uri: 'http://localhost:5000/graphql'
})

const system = useSystem()
export const errors = ref<Array<{ id: string, message: string, type: 'server' | 'network' }>>([])

const authLink = setContext(async (_, { headers }) => {
  const token = system.value.rsApiToken
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  }
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    const ids: string[] = []
    for (const err of graphQLErrors) {
      const id = uuid()
      errors.value.push({
        id,
        message: err.message,
        type: 'server'
      })
      ids.push(id)
      console.warn(err)
    }
    setTimeout(() => {
      for (const id of ids) {
        const errIdx = errors.value.findIndex(e => e.id === id)
        if (errIdx > -1) errors.value.splice(errIdx, 1)
      }
    }, 5000)
  }
  if (networkError) {
    const id = uuid()
    errors.value.push({
      id,
      message: networkError.message,
      type: 'network'
    })
    setTimeout(() => {
      const errIdx = errors.value.findIndex(e => e.id === id)
      if (errIdx > -1) errors.value.splice(errIdx, 1)
    }, 5000)
    console.error(networkError)
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
    },
    Category: {
      fields: {
        judgeAssignments: {
          merge: false
        },
        participants: {
          merge: false
        },
        entries: {
          merge: false
        }
      }
    }
  }
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache
})
