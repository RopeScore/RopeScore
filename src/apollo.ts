import { ApolloClient, createHttpLink, InMemoryCache, from, split } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { useSystem } from './hooks/system'
import useNotifications from './hooks/notifications'
import { getAuth } from 'firebase/auth'
import { Kind, OperationTypeNode } from 'graphql'
import { getMainDefinition } from '@apollo/client/utilities'
import { watch } from 'vue'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'https://api.ropescore.com/graphql'
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: () => { return import.meta.env.VITE_GRAPHQL_WS_ENDPOINT ?? 'wss://api.ropescore.com/graphql' },
    lazy: true,
    lazyCloseTimeout: 20 * 1000,
    connectionParams: async () => {
      const offOld = watch(() => system.settings.value.rsApiToken, () => {
        console.log('restarting due to old auth')
        wsLink.client.terminate()
        offOld()
      })

      const auth = getAuth()
      let firstChange = false
      const offNew = auth.onIdTokenChanged(() => {
        if (!firstChange) {
          firstChange = true
          return
        }
        console.log('restarting due to new auth')
        wsLink.client.terminate()
        offNew()
      })

      const token = system.settings.value.rsApiToken
      const firebaseToken = await new Promise<string | undefined>((resolve, reject) => {
        const off = auth.onAuthStateChanged(user => {
          off()
          if (user) {
            user.getIdToken()
              .then(token => { resolve(token) })
              .catch((err: Error) => { reject(err) })
          } else resolve(undefined)
        })
      })

      return {
        Authorization: token ? `Bearer ${token}` : '',
        'Firebase-Authorization': firebaseToken ? `Bearer ${firebaseToken}` : ''
      }
    }
  })
)

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
          .catch((err: Error) => { reject(err) })
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

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === Kind.OPERATION_DEFINITION &&
      definition.operation === OperationTypeNode.SUBSCRIPTION
    )
  },
  wsLink,
  from([errorLink, authLink, httpLink])
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache
})
