import { createApp } from 'vue'
import * as Sentry from '@sentry/vue'
import { Integrations } from '@sentry/tracing'
import 'virtual:windi.css'
import '../node_modules/@ropescore/components/dist/style.css'
import '@github/relative-time-element'
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
      tracingOrigins: ['localhost', 'core.ropescore.com'],
      routingInstrumentation: Sentry.vueRouterInstrumentation(router)
    })],
    tracesSampleRate: 1.0
  })
}
