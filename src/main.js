import { createApp } from "vue";
import { createPinia } from 'pinia'; // Import Pinia
import App from "./App.vue";
import router from './router';
import "../style.css";

// Create Pinia instance
const pinia = createPinia();

createApp(App)
  .use(router)
  .use(pinia) // Use Pinia
  .mount("#app");
