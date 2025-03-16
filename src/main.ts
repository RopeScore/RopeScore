import { createApp, type Component } from 'vue'
import * as Sentry from '@sentry/vue'
import 'virtual:windi.css'
import '../node_modules/@ropescore/components/dist/style.css'
import '@github/relative-time-element'
import App from './App.vue'
import router from './router'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { apolloClient } from './apollo'
import { version } from './helpers'
import { initializeApp } from 'firebase/app'

initializeApp({
  apiKey: 'AIzaSyCbOo3XqKZfQWkfudXQ-_5OKvNaWnSeRsA',
  authDomain: 'ropescore-app.firebaseapp.com',
  projectId: 'ropescore-app',
  messagingSenderId: '224455118938',
  appId: '1:224455118938:web:16809333c313cee9398863'
})

const app = createApp(App as Component)

app.provide(DefaultApolloClient, apolloClient)
  .use(router)
  .mount('#app')

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: 'https://dde56038805e456bb0f9bc120547ea07@sentry.io/1045868',
    release: version,
    environment: import.meta.env.VITE_CONTEXT?.toString(),
    tracePropagationTargets: [
      'localhost',
      'core.ropescore.com',
      'api.ropescore.com',
    ],
    integrations: [Sentry.browserTracingIntegration({
      router,
    })],
    tracesSampleRate: 1.0
  })
}
