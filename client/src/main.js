import 'basscss/css/basscss.min.css';
import 'basscss-basic/index.css';
import * as Sentry from '@sentry/browser';
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';


Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');

Sentry.init({
  dsn: 'https://dd53588b7d26461db775d462588ed1bb@sentry.io/1361667',
  integrations: [new Sentry.Integrations.Vue({ Vue })],
});
