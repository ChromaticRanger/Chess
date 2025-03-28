<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  color: {
    type: String,
    required: false, // Changed from true to false
    default: 'White', // Added a default value
    validator: (value) => value === null || ['White', 'Black'].includes(value)
  },
  position: {
    type: Object,
    required: false,
    default: () => ({ row: 0, col: 0 }),
    validator: (value) => 
      value && 
      (value.row === null || typeof value.row === 'number') && 
      (value.col === null || typeof value.col === 'number')
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['piece-selected']);

// Possible promotion pieces
const promotionPieces = computed(() => [
  { type: 'Queen', value: 'Q' },
  { type: 'Rook', value: 'R' },
  { type: 'Knight', value: 'Kn' },
  { type: 'Bishop', value: 'B' }
]);

// Define piece type codes for images
const PIECE_TYPE_MAP = {
  'Queen': 'Q',
  'Rook': 'R',
  'Knight': 'Kn',
  'Bishop': 'B'
};

// Get the asset path for a piece
const getAssetPath = (pieceTypeCode) => {
  // Use the same path format as in PieceFactory.js
  // pieceTypeCode is the short code (Q, R, Kn, B)
  const colorCode = props.color ? props.color.charAt(0) : 'W'; // Default to White if color is null
  return `src/assets/${pieceTypeCode}_${colorCode}.svg`;
};

// Handle promotion piece selection
const selectPiece = (pieceType) => {
  emit('piece-selected', {
    type: pieceType,
    color: props.color,
    position: props.position
  });
};
</script>

<template>
  <div 
    v-if="visible"
    class="promotion-container"
    :class="{ 'promotion-white': color === 'White', 'promotion-black': color === 'Black' }"
  >
    <div 
      v-for="piece in promotionPieces" 
      :key="piece.type"
      class="promotion-piece"
      @click="selectPiece(piece.type)"
    >
      <img 
        :src="getAssetPath(piece.value)" 
        :alt="`${color} ${piece.type}`" 
        class="piece-image"
      />
    </div>
  </div>
</template>

<style scoped>
.promotion-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  z-index: 2000; /* Higher z-index to ensure it's above all other pieces */
  background-color: rgba(255, 255, 255, 0.9);
  border: 2px solid #333;
  border-radius: 5px;
  padding: 8px;
  left: -120px;
}

.promotion-white {
  top: 0;
}

.promotion-black {
  bottom: 0;
}

.promotion-piece {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
  margin: 4px 0;
}

.promotion-piece:hover {
  background-color: rgba(173, 216, 230, 0.7);
}

.piece-image {
  width: 60px;
  height: 60px;
}
</style>