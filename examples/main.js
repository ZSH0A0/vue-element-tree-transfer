import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import iTreeTransfer from '../packages/index'
// import iTreeTransfer from 'vue-element-tree-transfer'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(iTreeTransfer)

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
