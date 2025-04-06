import { ref } from 'vue';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const games = ref([]);
const currentGame = ref(null);
const isLoading = ref(false);
const error = ref('');

export function usePositions() {
  // Fetch all games for the current user
  const fetchGames = async () => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await axios.get(`${API_URL}/games`);
      games.value = response.data.games;
      return { success: true, games: games.value };
    } catch (err) {
      console.error('Fetch games error:', err);
      error.value = err.response?.data?.error || 'Failed to fetch games';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch a specific game by ID
  const fetchGameById = async (id) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await axios.get(`${API_URL}/games/${id}`);
      currentGame.value = response.data.game;
      return { success: true, game: currentGame.value };
    } catch (err) {
      console.error('Fetch game error:', err);
      error.value = err.response?.data?.error || 'Failed to fetch game';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Create a new game
  const createGame = async (gameData) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await axios.post(`${API_URL}/games`, gameData);
      
      // Add to games array
      const newGame = response.data.game;
      games.value = [newGame, ...games.value];
      
      return { success: true, game: newGame };
    } catch (err) {
      console.error('Create game error:', err);
      error.value = err.response?.data?.error || 'Failed to create game';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Update a game
  const updateGame = async (id, gameData) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await axios.put(`${API_URL}/games/${id}`, gameData);
      
      // Update in games array
      const updatedGame = response.data.game;
      games.value = games.value.map(game => 
        game.id === updatedGame.id ? updatedGame : game
      );
      
      if (currentGame.value?.id === updatedGame.id) {
        currentGame.value = updatedGame;
      }
      
      return { success: true, game: updatedGame };
    } catch (err) {
      console.error('Update game error:', err);
      error.value = err.response?.data?.error || 'Failed to update game';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Delete a game
  const deleteGame = async (id) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      await axios.delete(`${API_URL}/games/${id}`);
      
      // Remove from games array
      games.value = games.value.filter(game => game.id !== id);
      
      if (currentGame.value?.id === id) {
        currentGame.value = null;
      }
      
      return { success: true };
    } catch (err) {
      console.error('Delete game error:', err);
      error.value = err.response?.data?.error || 'Failed to delete game';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // For backward compatibility
  const positions = games;
  const currentPosition = currentGame;
  const fetchPositions = fetchGames;
  const fetchPositionById = fetchGameById;
  const createPosition = createGame;
  const updatePosition = updateGame;
  const deletePosition = deleteGame;

  return {
    // New names
    games,
    currentGame,
    isLoading,
    error,
    fetchGames,
    fetchGameById,
    createGame,
    updateGame,
    deleteGame,
    
    // For backward compatibility
    positions,
    currentPosition,
    fetchPositions,
    fetchPositionById,
    createPosition,
    updatePosition,
    deletePosition
  };
}