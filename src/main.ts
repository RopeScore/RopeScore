import { createApp } from 'vue'
import * as Sentry from '@sentry/vue'
import { Integrations } from '@sentry/tracing'
import 'virtual:windi.css'
import '@github/time-elements'
import App from './App.vue'
import router from './router'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { apolloClient } from './apollo'
import { name, version } from '../package.json'

const app = createApp(App)

app.provide(DefaultApolloClient, apolloClient)
  .use(router)
  .mount('#app')

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: 'https://dde56038805e456bb0f9bc120547ea07@sentry.io/1045868',
    release: `${name}@${version}`,
    logErrors: true,
    integrations: [new Integrations.BrowserTracing({
      tracingOrigins: ['localhost'],
      routingInstrumentation: Sentry.vueRouterInstrumentation(router)
    })],
    tracesSampleRate: 1.0
  })
}
