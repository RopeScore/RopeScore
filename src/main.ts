import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './plugins/store'
import vuetify from './plugins/vuetify'

import { name, version } from '../package.json'

Vue.config.productionTip = false

import * as Sentry from '@sentry/browser';
import * as Integrations from '@sentry/integrations';

Sentry.init({
  dsn: 'https://dde56038805e456bb0f9bc120547ea07@sentry.io/1045868',
  integrations: [new Integrations.Vue({Vue, attachProps: true})],
  release: `${name}@${version}`,
  debug: true,
  beforeSend: (event, hint) => {
    console.error(hint?.originalException || hint?.syntheticException || event);
    return event;
   }
})

new Vue({
  router,
  store,
  vuetify,
  render: (h: any) => h(App)
}).$mount('#app')
