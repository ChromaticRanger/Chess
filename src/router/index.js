import { createRouter, createWebHistory } from 'vue-router';
import GameInput from '../views/GameInput.vue';
import GameHistory from '../views/GameHistory.vue';
import Settings from '../views/Settings.vue';
import AuthPage from '../components/AuthPage.vue'; // Import AuthPage component

const routes = [
  {
    path: '/',
    redirect: '/game-input'
  },
  {
    path: '/game-input',
    name: 'GameInput',
    component: GameInput
  },
  {
    path: '/game-history',
    name: 'GameHistory',
    component: GameHistory
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/auth', // Add the auth route
    name: 'Auth',
    component: AuthPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;