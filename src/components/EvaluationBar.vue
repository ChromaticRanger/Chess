<template>
  <div class="eval-bar-container">
    <!-- Black advantage (top/left) -->
    <div
      class="black-section"
      :style="sectionStyle(blackPercentage)"
    >
      <span v-if="evaluation && blackPercentage >= whitePercentage" class="score-text text-gray-100">
        {{ displayScore }}
      </span>
    </div>

    <!-- Center line marker -->
    <div class="center-line"></div>

    <!-- White advantage (bottom/right) -->
    <div
      class="white-section"
      :style="sectionStyle(whitePercentage)"
    >
      <span v-if="evaluation && whitePercentage > blackPercentage" class="score-text text-gray-800">
        {{ displayScore }}
      </span>
    </div>

    <!-- Loading indicator overlay -->
    <div v-if="isAnalyzing" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  evaluation: {
    type: Object,
    default: null
  },
  isAnalyzing: {
    type: Boolean,
    default: false
  }
});

// Format score for display
const displayScore = computed(() => {
  if (!props.evaluation) return '';

  const { score, scoreType } = props.evaluation;

  if (scoreType === 'mate') {
    const prefix = score > 0 ? '+' : '';
    return `M${prefix}${Math.abs(score)}`;
  }

  // Convert centipawns to pawns with sign
  const pawns = score / 100;
  const prefix = pawns > 0 ? '+' : '';
  return `${prefix}${pawns.toFixed(1)}`;
});

// Calculate white's percentage of the bar (white at bottom)
const whitePercentage = computed(() => {
  if (!props.evaluation) return 50;

  const { score, scoreType } = props.evaluation;

  // Mate scores: 100% or 0%
  if (scoreType === 'mate') {
    return score > 0 ? 95 : 5;
  }

  // Normalize score: cap at ±500 centipawns (5 pawns)
  // 0 cp = 50%, +500 cp = 100%, -500 cp = 0%
  const normalized = Math.max(-500, Math.min(500, score));
  return 50 + (normalized / 10);
});

// Black's percentage is the remainder
const blackPercentage = computed(() => {
  return 100 - whitePercentage.value;
});

// Generate style object for sections (flex for desktop, CSS var for mobile width)
const sectionStyle = (percentage) => ({
  flex: percentage,
  '--pct': percentage + '%'
});
</script>

<style scoped>
.eval-bar-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  background-color: #1f2937;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
  border: 1px solid #9ca3af;
}

.black-section {
  background-color: #111827;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex: var(--pct);
  transition: flex 0.3s ease-out, width 0.3s ease-out;
  min-height: 0;
}

.white-section {
  background-color: #f3f4f6;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: var(--pct);
  transition: flex 0.3s ease-out, width 0.3s ease-out;
  min-height: 0;
}

.score-text {
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem;
}

.center-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #6b7280;
  opacity: 0.5;
  transform: translateY(-50%);
  pointer-events: none;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(31, 41, 55, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid #9ca3af;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile horizontal bar */
@media (max-width: 999px) {
  .eval-bar-container {
    flex-direction: row;
    height: 24px;
    width: 100%;
    background-color: #f3f4f6;
  }

  .black-section {
    align-items: center;
    background-color: #111827;
    width: var(--pct);
    flex: none;
    height: 100%;
  }

  .white-section {
    align-items: center;
    background-color: #f3f4f6;
    width: var(--pct);
    flex: none;
    height: 100%;
  }

  .center-line {
    top: 0;
    bottom: 0;
    left: 50%;
    right: auto;
    width: 1px;
    height: 100%;
    transform: translateX(-50%);
  }
}
</style>
