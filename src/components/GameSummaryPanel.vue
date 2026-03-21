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

const resultLabel = computed(() => {
  const r = props.gameMetadata?.result;
  if (r === "1-0") return { text: "1–0", title: "White wins" };
  if (r === "0-1") return { text: "0–1", title: "Black wins" };
  if (r === "1/2-1/2") return { text: "½–½", title: "Draw" };
  return null;
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
      <p class="players">
        {{ formattedPlayers }}
        <span v-if="resultLabel" class="result-badge" :title="resultLabel.title">{{ resultLabel.text }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.game-summary-panel {
  background: linear-gradient(180deg, #1e2a3a 0%, #19233a 100%);
  border: 1px solid rgba(210, 180, 110, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
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

.header:hover .game-name {
  color: #e8cc8a;
}

.game-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #d2b46e;
  margin: 0;
  transition: color 0.15s ease;
}

.toggle-icon {
  font-size: 0.75rem;
  color: rgba(210, 180, 110, 0.5);
  user-select: none;
}

.details-section {
  text-align: center;
  margin-top: 0.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding-top: 0.35rem;
}

.game-details {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 0.2rem 0;
}

.players {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.result-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #d2b46e;
  background: rgba(210, 180, 110, 0.12);
  border: 1px solid rgba(210, 180, 110, 0.35);
  border-radius: 0.25rem;
  padding: 0.1rem 0.4rem;
  letter-spacing: 0.02em;
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
