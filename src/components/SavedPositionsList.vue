<script setup>
import { ref, onMounted, watch } from 'vue';
import { usePositions } from '../composables/usePositions';

const { positions, isLoading, error, fetchPositions, deletePosition } = usePositions();

const emit = defineEmits(['load-position']);

// Local state
const selectedPositionId = ref(null);
const deleteConfirmId = ref(null);
const loadingState = ref({});

// Load positions when component is mounted
onMounted(async () => {
  await loadPositions();
});

// Fetch all positions
const loadPositions = async () => {
  await fetchPositions();
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Handle position selection
const selectPosition = (id) => {
  selectedPositionId.value = id;
};

// Load the selected position
const loadPosition = async (position) => {
  loadingState.value[position.id] = true;
  
  try {
    emit('load-position', position);
  } catch (err) {
    console.error('Error loading position:', err);
  } finally {
    loadingState.value[position.id] = false;
  }
};

// Show delete confirmation
const confirmDelete = (id, event) => {
  event.stopPropagation();
  deleteConfirmId.value = id;
};

// Cancel delete
const cancelDelete = (event) => {
  event.stopPropagation();
  deleteConfirmId.value = null;
};

// Handle position deletion
const handleDelete = async (id, event) => {
  event.stopPropagation();
  loadingState.value[id] = true;
  
  try {
    await deletePosition(id);
    deleteConfirmId.value = null;
    
    // If the deleted position was selected, clear the selection
    if (selectedPositionId.value === id) {
      selectedPositionId.value = null;
    }
  } catch (err) {
    console.error('Error deleting position:', err);
  } finally {
    loadingState.value[id] = false;
  }
};
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-md p-4 h-full">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Saved Positions</h3>
      <button 
        @click="loadPositions" 
        class="text-blue-600 hover:text-blue-800 text-sm"
      >
        Refresh
      </button>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading && !positions.length" class="text-center py-6">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-gray-600">Loading positions...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="text-center py-6 text-red-500">
      <p>{{ error }}</p>
      <button 
        @click="loadPositions" 
        class="mt-2 text-blue-600 hover:text-blue-800"
      >
        Try Again
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!positions.length" class="text-center py-8">
      <p class="text-gray-500">You haven't saved any positions yet.</p>
      <p class="text-gray-500 mt-1">Create your first position and click "Save"!</p>
    </div>
    
    <!-- Position list -->
    <div v-else class="overflow-y-auto max-h-96">
      <ul class="divide-y divide-gray-200">
        <li 
          v-for="position in positions" 
          :key="position.id"
          @click="selectPosition(position.id)"
          :class="[
            'p-3 hover:bg-gray-50 cursor-pointer transition-colors',
            selectedPositionId === position.id ? 'bg-blue-50' : ''
          ]"
        >
          <div class="flex justify-between">
            <div>
              <h4 class="font-medium text-gray-900">{{ position.name }}</h4>
              <p v-if="position.description" class="text-sm text-gray-600 mt-1">
                {{ position.description }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Saved: {{ formatDate(position.createdAt) }}
              </p>
            </div>
            
            <div class="flex items-start space-x-2">
              <!-- Load button -->
              <button 
                @click="loadPosition(position)"
                class="text-blue-600 hover:bg-blue-100 p-1 rounded"
                :disabled="loadingState[position.id]"
              >
                <span v-if="loadingState[position.id]">Loading...</span>
                <span v-else>Load</span>
              </button>
              
              <!-- Delete button/confirmation -->
              <div v-if="deleteConfirmId === position.id">
                <div class="flex items-center space-x-1">
                  <button 
                    @click="handleDelete(position.id, $event)"
                    class="text-red-600 hover:bg-red-100 p-1 rounded text-xs"
                    :disabled="loadingState[position.id]"
                  >
                    Confirm
                  </button>
                  <button 
                    @click="cancelDelete($event)"
                    class="text-gray-600 hover:bg-gray-100 p-1 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <button 
                v-else
                @click="confirmDelete(position.id, $event)"
                class="text-gray-400 hover:text-red-600 p-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.max-h-96 {
  max-height: 24rem;
}
</style>