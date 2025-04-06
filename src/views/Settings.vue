<template>
  <div class="settings-view p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Settings</h1>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <p class="text-center text-gray-600 py-8">
          Settings functionality will be implemented in a future update.
        </p>
        
        <!-- Placeholder for future settings -->
        <div class="opacity-50 pointer-events-none">
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Display Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input type="checkbox" id="darkMode" class="mr-2" disabled>
                <label for="darkMode">Dark Mode</label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="flipOrientation" class="mr-2" disabled>
                <label for="flipOrientation">Default Board Orientation (Black on Bottom)</label>
              </div>
            </div>
          </div>
          
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Gameplay Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input type="checkbox" id="showLegalMoves" class="mr-2" disabled checked>
                <label for="showLegalMoves">Show Legal Moves</label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="showCheck" class="mr-2" disabled checked>
                <label for="showCheck">Highlight Check</label>
              </div>
            </div>
          </div>
          
          <div>
            <h2 class="text-xl font-semibold mb-4">Notification Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input type="checkbox" id="soundEffects" class="mr-2" disabled>
                <label for="soundEffects">Sound Effects</label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="moveConfirmation" class="mr-2" disabled>
                <label for="moveConfirmation">Confirm Moves</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Settings functionality will be implemented later
</script>

<style scoped>
.settings-view {
  min-height: calc(100vh - 160px);
}
</style>