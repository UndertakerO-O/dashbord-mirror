import { createApp } from 'vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import App from './App.vue';
import router from './router';

// Le router centralise les pages publiques et protégées de l’application.
createApp(App).use(router).mount('#app');
