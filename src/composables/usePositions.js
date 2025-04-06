import { ref } from 'vue';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const positions = ref([]);
const currentPosition = ref(null);
const isLoading = ref(false);
const error = ref('');

export function usePositions() {
  // Fetch all positions for the current user
  const fetchPositions = async () => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await axios.get(`${API_URL}/positions`);
      positions.value = response.data.positions;
      return { success: true, positions: positions.value };
    } catch (err) {
      console.error('Fetch positions error:', err);
      error.value = err.response?.data?.error || 'Failed to fetch positions';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch a specific position by ID
  const fetchPositionById = async (id) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await axios.get(`${API_URL}/positions/${id}`);
      currentPosition.value = response.data.position;
      return { success: true, position: currentPosition.value };
    } catch (err) {
      console.error('Fetch position error:', err);
      error.value = err.response?.data?.error || 'Failed to fetch position';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Create a new position
  const createPosition = async (positionData) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await axios.post(`${API_URL}/positions`, positionData);
      
      // Add to positions array
      const newPosition = response.data.position;
      positions.value = [newPosition, ...positions.value];
      
      return { success: true, position: newPosition };
    } catch (err) {
      console.error('Create position error:', err);
      error.value = err.response?.data?.error || 'Failed to create position';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Update a position
  const updatePosition = async (id, positionData) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await axios.put(`${API_URL}/positions/${id}`, positionData);
      
      // Update in positions array
      const updatedPosition = response.data.position;
      positions.value = positions.value.map(pos => 
        pos.id === updatedPosition.id ? updatedPosition : pos
      );
      
      if (currentPosition.value?.id === updatedPosition.id) {
        currentPosition.value = updatedPosition;
      }
      
      return { success: true, position: updatedPosition };
    } catch (err) {
      console.error('Update position error:', err);
      error.value = err.response?.data?.error || 'Failed to update position';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Delete a position
  const deletePosition = async (id) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      await axios.delete(`${API_URL}/positions/${id}`);
      
      // Remove from positions array
      positions.value = positions.value.filter(pos => pos.id !== id);
      
      if (currentPosition.value?.id === id) {
        currentPosition.value = null;
      }
      
      return { success: true };
    } catch (err) {
      console.error('Delete position error:', err);
      error.value = err.response?.data?.error || 'Failed to delete position';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    positions,
    currentPosition,
    isLoading,
    error,
    fetchPositions,
    fetchPositionById,
    createPosition,
    updatePosition,
    deletePosition
  };
}