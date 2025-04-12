<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" @click.self="$emit('cancel')">
    <div class="bg-white rounded-md shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-4 bg-blue-600 text-white rounded-t-md">
        <h3 class="font-semibold text-lg">Save Game</h3>
        <button class="text-2xl leading-none hover:text-gray-300" @click="$emit('cancel')">×</button>
      </div>
      
      <!-- Form content -->
      <form @submit.prevent="saveGame" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Game metadata section -->
          <div class="space-y-4 col-span-full">
            <h4 class="font-semibold text-gray-700 border-b pb-2">Game Information</h4>
            
            <div class="form-group">
              <label for="game-name" class="block text-sm font-medium text-gray-700 mb-1">Game Name</label>
              <input 
                id="game-name" 
                v-model="gameData.name" 
                type="text" 
                class="form-input w-full shadow-sm"
                placeholder="e.g., Smith vs Johnson - City Championship"
                required
              />
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Date -->
              <div class="form-group">
                <label for="game-date" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  id="game-date" 
                  v-model="gameData.date" 
                  type="date" 
                  class="form-input w-full shadow-sm"
                />
              </div>
              
              <!-- Venue -->
              <div class="form-group">
                <label for="venue" class="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input 
                  id="venue" 
                  v-model="gameData.venue" 
                  type="text" 
                  class="form-input w-full shadow-sm"
                  placeholder="e.g., City Chess Club"
                />
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Event -->
              <div class="form-group">
                <label for="event" class="block text-sm font-medium text-gray-700 mb-1">Event</label>
                <input 
                  id="event" 
                  v-model="gameData.event" 
                  type="text" 
                  class="form-input w-full shadow-sm"
                  placeholder="e.g., City Championship"
                />
              </div>
              
              <!-- Round -->
              <div class="form-group">
                <label for="round" class="block text-sm font-medium text-gray-700 mb-1">Round</label>
                <input 
                  id="round" 
                  v-model="gameData.round" 
                  type="text" 
                  class="form-input w-full shadow-sm"
                  placeholder="e.g., Round 3"
                />
              </div>
            </div>
          </div>
          
          <!-- Players section -->
          <div class="space-y-4">
            <h4 class="font-semibold text-gray-700 border-b pb-2">White Player</h4>
            
            <div class="form-group">
              <label for="white-player" class="block text-sm font-medium text-gray-700 mb-1">White Player Name</label>
              <input 
                id="white-player" 
                v-model="gameData.whitePlayer" 
                type="text" 
                class="form-input w-full shadow-sm"
                placeholder="e.g., John Smith"
              />
            </div>
            
            <div class="form-group">
              <label for="white-rating" class="block text-sm font-medium text-gray-700 mb-1">White Rating</label>
              <input 
                id="white-rating" 
                v-model="gameData.whiteRating" 
                type="number" 
                class="form-input w-full shadow-sm"
                placeholder="e.g., 1500"
              />
            </div>
          </div>
          
          <div class="space-y-4">
            <h4 class="font-semibold text-gray-700 border-b pb-2">Black Player</h4>
            
            <div class="form-group">
              <label for="black-player" class="block text-sm font-medium text-gray-700 mb-1">Black Player Name</label>
              <input 
                id="black-player" 
                v-model="gameData.blackPlayer" 
                type="text" 
                class="form-input w-full shadow-sm"
                placeholder="e.g., Jane Johnson"
              />
            </div>
            
            <div class="form-group">
              <label for="black-rating" class="block text-sm font-medium text-gray-700 mb-1">Black Rating</label>
              <input 
                id="black-rating" 
                v-model="gameData.blackRating" 
                type="number" 
                class="form-input w-full shadow-sm"
                placeholder="e.g., 1600"
              />
            </div>
          </div>
          
          <!-- Game Result section -->
          <div class="col-span-full">
            <div class="form-group">
              <label for="result" class="block text-sm font-medium text-gray-700 mb-1">Game Result</label>
              <select 
                id="result" 
                v-model="gameData.result" 
                class="form-select w-full shadow-sm"
              >
                <option value="In Progress">In Progress</option>
                <option value="White Win">White Win</option>
                <option value="Black Win">Black Win</option>
                <option value="White Resigned">White Resigned</option>
                <option value="Black Resigned">Black Resigned</option>
                <option value="Draw Agreed">Draw Agreed</option>
                <option value="Draw - By Stalemate">Draw - By Stalemate</option>
              </select>
            </div>
          </div>
          
          <!-- Description section -->
          <div class="col-span-full">
            <div class="form-group">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Game Description</label>
              <textarea 
                id="description" 
                v-model="gameData.description" 
                class="form-textarea w-full shadow-sm h-24"
                placeholder="Add any notes or description about this game..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <!-- Buttons -->
        <div class="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Save Game
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Game data model
const gameData = ref({
  name: '',
  date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  venue: '',
  event: '',
  round: '',
  whitePlayer: '',
  whiteRating: '',
  blackPlayer: '',
  blackRating: '',
  description: '',
  result: 'In Progress', // Default to In Progress
  // The move history will be passed in from the parent component
});

// Emit events for parent component
const emit = defineEmits(['save', 'cancel']);

// Define props
const props = defineProps({
  moveHistory: {
    type: Array,
    default: () => []
  },
  result: {
    type: String,
    default: 'In Progress'
  }
});

// Save the game
const saveGame = () => {
  // Create a complete game object with move history
  const completeGameData = {
    ...gameData.value,
    moveHistory: props.moveHistory,
  };
  
  // Emit save event with game data
  emit('save', completeGameData);
};

// Set up default values
onMounted(() => {
  // Set the result from props
  gameData.value.result = props.result;
});
</script>

<style scoped>
/* Any component-specific styles can go here */
/* These classes assist with form styling */
.form-input, .form-textarea, .form-select {
  @apply px-3 py-2 border border-gray-300 rounded-md;
}

/* Let the browser handle focus styles naturally */
</style>