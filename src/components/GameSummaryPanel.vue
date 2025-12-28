<script setup>
import { ref, computed } from "vue";

const isCollapsed = ref(false);
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const props = defineProps({
  gameMetadata: {
    type: Object,
    default: null,
  },
});

// Format date nicely
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Build details line: Date • Venue • Event • Round
const formattedDetails = computed(() => {
  if (!props.gameMetadata) return "";

  const parts = [];

  if (props.gameMetadata.date) {
    parts.push(formatDate(props.gameMetadata.date));
  }
  if (props.gameMetadata.venue) {
    parts.push(props.gameMetadata.venue);
  }
  if (props.gameMetadata.event) {
    parts.push(props.gameMetadata.event);
  }
  if (props.gameMetadata.round) {
    parts.push(`Round ${props.gameMetadata.round}`);
  }

  return parts.join(" • ");
});

// Build players line: White (rating) vs Black (rating)
const formattedPlayers = computed(() => {
  if (!props.gameMetadata) return "";

  const white = props.gameMetadata.whitePlayer || "White";
  const black = props.gameMetadata.blackPlayer || "Black";
  const whiteRating = props.gameMetadata.whiteRating;
  const blackRating = props.gameMetadata.blackRating;

  let whitePart = white;
  if (whiteRating) {
    whitePart += ` (${whiteRating})`;
  }

  let blackPart = black;
  if (blackRating) {
    blackPart += ` (${blackRating})`;
  }

  return `${whitePart} vs ${blackPart}`;
});
</script>

<template>
  <div v-if="gameMetadata" class="game-summary-panel" :class="{ collapsed: isCollapsed }">
    <div class="header" @click="toggleCollapse">
      <h2 class="game-name">{{ gameMetadata.name }}</h2>
      <span class="toggle-icon">{{ isCollapsed ? '▼' : '▲' }}</span>
    </div>
    <div v-if="!isCollapsed" class="details-section">
      <p v-if="formattedDetails" class="game-details">{{ formattedDetails }}</p>
      <p class="players">{{ formattedPlayers }}</p>
    </div>
  </div>
</template>

<style scoped>
.game-summary-panel {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}

.game-summary-panel.collapsed {
  padding: 0.5rem 1rem;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
}

.header:hover {
  opacity: 0.8;
}

.game-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0;
}

.toggle-icon {
  font-size: 0.75rem;
  color: #6b7280;
  user-select: none;
}

.details-section {
  text-align: center;
  margin-top: 0.25rem;
}

.game-details {
  font-size: 0.875rem;
  color: #4b5563;
  margin: 0 0 0.25rem 0;
}

.players {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  margin: 0;
}

/* Mobile adjustments */
@media (max-width: 999px) {
  .game-summary-panel {
    padding: 0.5rem 0.75rem;
  }

  .game-summary-panel.collapsed {
    padding: 0.375rem 0.75rem;
  }

  .game-name {
    font-size: 1rem;
  }

  .game-details,
  .players {
    font-size: 0.8rem;
  }
}
</style>
