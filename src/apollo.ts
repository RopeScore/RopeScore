import { ApolloClient, createHttpLink, InMemoryCache, from } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'
import { useSystem } from './hooks/system'
import useNotifications from './hooks/notifications'
import { getAuth } from 'firebase/auth'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'https://api.ropescore.com/graphql'
})

const system = useSystem()
const notifications = useNotifications()

const authLink = setContext(async (_, { headers }) => {
  const auth = getAuth()
  const token = system.settings.value.rsApiToken
  const firebaseToken = await new Promise<string | undefined>((resolve, reject) => {
    const off = auth.onAuthStateChanged(user => {
      off()
      if (user) {
        user.getIdToken()
          .then(token => { resolve(token) })
          .catch(err => { reject(err) })
      } else resolve(undefined)
    })
  })

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'firebase-authorization': firebaseToken ? `Bearer ${firebaseToken}` : ''
    }
  }
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      notifications.push({
        message: err.message,
        type: 'server'
      })
      console.warn(err)
    }
  }
  if (networkError) {
    notifications.push({
      message: networkError.message,
      type: 'network'
    })
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
