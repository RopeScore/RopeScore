import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/store'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

new Vue(<any>{
  router,
  store,
  vuetify,
  render: (h: any) => h(App)
}).$mount('#app')

console.log(store)
