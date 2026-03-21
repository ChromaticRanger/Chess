<script setup>
import { computed } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Notification",
  },
  message: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "",
  },
  showActions: {
    type: Boolean,
    default: false,
  },
  confirmText: {
    type: String,
    default: "Confirm",
  },
  confirmClass: {
    type: String,
    default: "bg-[#d2b46e] hover:bg-[#c4a35f] text-[#1e2a3a] font-semibold",
  },
  cancelText: {
    type: String,
    default: "Cancel",
  },
});

const emit = defineEmits(["close", "confirm"]);

const handleClose = () => {
  emit("close");
};

const handleConfirm = () => {
  emit("confirm");
  emit("close");
};

// Determine if icon should be displayed
const hasIcon = computed(() => !!props.icon);
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
    @click.self="handleClose"
  >
    <div class="bg-[#1a2535] border border-[rgba(210,180,110,0.2)] rounded-md shadow-lg w-96 max-w-[90%]">
      <div
        class="flex justify-between items-center p-3 bg-[#1e2a3a] text-white rounded-t-md border-b border-[rgba(210,180,110,0.25)]"
      >
        <h3 class="font-semibold text-lg text-[#d2b46e]">{{ title }}</h3>
        <button
          class="text-2xl leading-none text-white/60 hover:text-white transition-colors"
          @click="handleClose"
        >
          ×
        </button>
      </div>
      <div class="p-5 flex items-start text-gray-200">
        <div v-if="hasIcon" class="mr-4 flex-shrink-0">
          <img :src="icon" alt="Notification icon" class="w-8 h-8" />
        </div>
        <div class="flex-grow">
          {{ message }}
        </div>
      </div>
      <div
        v-if="showActions"
        class="p-3 bg-[#141e2e] rounded-b-md flex justify-end space-x-2 border-t border-white/5"
      >
        <button
          class="px-4 py-2 rounded text-sm font-medium bg-transparent border border-white/20 text-gray-300 hover:bg-white/10 transition-colors"
          @click="handleClose"
        >
          {{ cancelText }}
        </button>
        <button
          class="px-4 py-2 rounded text-sm font-medium transition-colors"
          :class="confirmClass"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
