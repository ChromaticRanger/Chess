# Chess Engine Integration - Product Requirements Document

## Document Information
- **Project**: Chess Application - Engine Evaluation & Opening Detection
- **Version**: 1.0
- **Date**: January 2026
- **Author**: Technical Specification

---

## Executive Summary

This PRD outlines the implementation of chess engine evaluation and opening detection features for an existing Vue 3 chess application. The solution will integrate Stockfish WASM for client-side position analysis, display real-time evaluation bars, identify chess openings, and persist analysis data to a PostgreSQL database.

---

## Background & Context

### Current Application Architecture

**Frontend:**
- Framework: Vue 3 + Vite
- State Management: Pinia
- Chess Logic: chess.js (v1.2.0)
- Custom Vue components (Board.vue, Square.vue, Piece.vue)
- Routing: Vue Router (4 routes: /game-input, /game-history, /settings, /auth)
- HTTP Client: Axios

**Backend:**
- Node.js REST API
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT + Google OAuth
- Existing endpoints: /api/auth/*, /api/games/*

**Application Purpose:**
Game logging and review tool ("logmychessgames") - users input and analyze their completed chess games rather than playing in real-time.

---

## Goals & Objectives

### Primary Goals
1. Add real-time position evaluation during game review
2. Display visual evaluation bar next to the chess board
3. Show opening names for recognized positions
4. Persist evaluations to avoid re-analyzing positions
5. Allow user-configurable analysis depth

### Success Criteria
- Evaluation bar updates within 1-10 seconds based on depth setting
- Evaluations persist across sessions via database
- Opening names display for at least first 10-15 moves of common openings
- User can adjust analysis depth from settings
- No impact on existing game input/review functionality

---

## Technical Requirements

### Dependencies

**Frontend:**
```json
{
  "stockfish.wasm": "^0.11.0"
}
```

**Backend:**
- No new dependencies (using existing Prisma)

### Browser Requirements
- Modern browser with WebAssembly support
- Minimum 2GB RAM recommended for deeper analysis

---

## Implementation Specification

### 1. Database Schema Changes

**File:** `backend/prisma/schema.prisma`

Add to existing Game model:
```prisma
model Game {
  id          String   @id @default(uuid())
  userId      String
  // ... existing fields ...
  evaluations Json?    // Stores position evaluations
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
}
```

Add new UserSettings model:
```prisma
model UserSettings {
  id              String  @id @default(uuid())
  userId          String  @unique
  analysisDepth   Int     @default(15)
  
  user            User    @relation(fields: [userId], references: [id])
}
```

**Migration Command:**
```bash
cd backend
npx prisma migrate dev --name add_evaluations
```

**Data Structure for evaluations JSON:**
```json
{
  "fen_string": {
    "score": 50,
    "scoreType": "cp",
    "bestMove": "e2e4",
    "depth": 15,
    "fen": "fen_string"
  }
}
```

---

### 2. Backend API Endpoints

**File:** `backend/routes/analysis.js` (new file)

#### Endpoint 1: Save Evaluations
```
POST /api/games/:gameId/evaluations
```

**Request Body:**
```json
{
  "evaluations": {
    "fen": { "score": 50, "scoreType": "cp", "bestMove": "e2e4", "depth": 15 }
  }
}
```

**Response:**
```json
{
  "success": true,
  "game": { /* game object */ }
}
```

**Implementation:**
```javascript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Save evaluations for a game
router.post('/games/:gameId/evaluations', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { evaluations } = req.body;
    
    const game = await prisma.game.update({
      where: { id: gameId },
      data: { evaluations }
    });
    
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Endpoint 2: Get Evaluations
```
GET /api/games/:gameId/evaluations
```

**Response:**
```json
{
  "evaluations": { /* evaluations object */ }
}
```

**Implementation:**
```javascript
router.get('/games/:gameId/evaluations', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { evaluations: true }
    });
    
    res.json({ evaluations: game?.evaluations || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Endpoint 3: Get User Settings
```
GET /api/settings
```

**Headers:** Requires JWT authentication

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "analysisDepth": 15
}
```

**Implementation:**
```javascript
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware
    
    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });
    
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId }
      });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Endpoint 4: Update User Settings
```
PATCH /api/settings
```

**Request Body:**
```json
{
  "analysisDepth": 18
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "analysisDepth": 18
}
```

**Implementation:**
```javascript
router.patch('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { analysisDepth } = req.body;
    
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: { analysisDepth },
      create: { userId, analysisDepth }
    });
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Route Registration:**
Update `backend/index.js`:
```javascript
import analysisRouter from './routes/analysis.js';
app.use('/api', analysisRouter);
```

---

### 3. Opening Book Data

**File:** `src/data/openings.json` (new file)

**Format:**
```json
{
  "fen_string": {
    "name": "Opening Name",
    "eco": "ECO_CODE"
  }
}
```

**Example Entries:**
```json
{
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": {
    "name": "Starting Position",
    "eco": "A00"
  },
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": {
    "name": "King's Pawn Opening",
    "eco": "B00"
  },
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2": {
    "name": "King's Pawn Game",
    "eco": "C20"
  },
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2": {
    "name": "Sicilian Defense",
    "eco": "B20"
  }
}
```

**Note:** Minimal example provided. Recommend using comprehensive opening database:
- [Lichess Opening Database](https://github.com/lichess-org/chess-openings)
- Should include ~2000+ positions for good coverage

---

### 4. Stockfish Integration Composable

**File:** `src/composables/useStockfish.js` (new file)

**Exports:**
```javascript
{
  initEngine,        // Function: async () => void
  analyzePosition,   // Function: (fen: string, depth: number) => Promise<Evaluation>
  stopAnalysis,      // Function: () => void
  terminate,         // Function: () => void
  isReady,          // Ref<boolean>
  isAnalyzing,      // Ref<boolean>
  currentEvaluation // Ref<Evaluation | null>
}
```

**Evaluation Type:**
```typescript
{
  score: number,           // centipawns or mate moves
  scoreType: 'cp' | 'mate',
  bestMove: string,        // UCI notation (e.g., "e2e4")
  depth: number,
  fen: string
}
```

**Full Implementation:**
```javascript
import { ref, onUnmounted } from 'vue';

export function useStockfish() {
  const engine = ref(null);
  const isReady = ref(false);
  const isAnalyzing = ref(false);
  const currentEvaluation = ref(null);

  const initEngine = async () => {
    if (engine.value) return;

    try {
      const Stockfish = await import('stockfish.wasm');
      engine.value = await Stockfish.default();
      
      engine.value.addMessageListener((message) => {
        if (message === 'uciok') {
          isReady.value = true;
        }
      });

      engine.value.postMessage('uci');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
    }
  };

  const analyzePosition = (fen, depth = 15) => {
    return new Promise((resolve) => {
      if (!engine.value || !isReady.value) {
        resolve(null);
        return;
      }

      isAnalyzing.value = true;
      let bestMove = null;
      let score = null;
      let scoreType = 'cp';

      const messageHandler = (message) => {
        if (message.startsWith('info') && message.includes('score')) {
          const cpMatch = message.match(/score cp (-?\d+)/);
          const mateMatch = message.match(/score mate (-?\d+)/);
          
          if (mateMatch) {
            score = parseInt(mateMatch[1]);
            scoreType = 'mate';
          } else if (cpMatch) {
            score = parseInt(cpMatch[1]);
            scoreType = 'cp';
          }
        }

        if (message.startsWith('bestmove')) {
          const moveMatch = message.match(/bestmove (\S+)/);
          if (moveMatch) {
            bestMove = moveMatch[1];
          }

          engine.value.removeMessageListener(messageHandler);
          isAnalyzing.value = false;

          const evaluation = {
            score,
            scoreType,
            bestMove,
            depth,
            fen
          };

          currentEvaluation.value = evaluation;
          resolve(evaluation);
        }
      };

      engine.value.addMessageListener(messageHandler);
      engine.value.postMessage(`position fen ${fen}`);
      engine.value.postMessage(`go depth ${depth}`);
    });
  };

  const stopAnalysis = () => {
    if (engine.value && isAnalyzing.value) {
      engine.value.postMessage('stop');
      isAnalyzing.value = false;
    }
  };

  const terminate = () => {
    if (engine.value) {
      engine.value.terminate();
      engine.value = null;
      isReady.value = false;
    }
  };

  onUnmounted(() => {
    terminate();
  });

  return {
    initEngine,
    analyzePosition,
    stopAnalysis,
    terminate,
    isReady,
    isAnalyzing,
    currentEvaluation
  };
}
```

**Key Behaviors:**
- Initializes Stockfish WASM engine on first call
- Sends UCI commands to engine
- Parses engine output for score and best move
- Returns Promise that resolves when analysis complete
- Auto-cleanup on component unmount

**Engine Communication Protocol:**
1. Send: `uci` → Wait for: `uciok`
2. Send: `position fen {fen}`
3. Send: `go depth {depth}`
4. Parse: `info score cp/mate` messages
5. Parse: `bestmove` for completion

---

### 5. Evaluation Bar Component

**File:** `src/components/EvaluationBar.vue` (new file)

**Full Implementation:**
```vue
<template>
  <div class="flex flex-col h-full w-12 bg-gray-800 rounded-lg overflow-hidden relative">
    <!-- Opening Name Display -->
    <div 
      v-if="openingName" 
      class="absolute -left-2 top-4 transform -rotate-90 origin-left text-xs text-gray-400 whitespace-nowrap"
      style="transform-origin: left top;"
    >
      {{ openingName }}
    </div>

    <!-- Evaluation Bar -->
    <div class="flex-1 relative flex flex-col">
      <!-- White advantage (bottom) -->
      <div 
        class="bg-gray-100 transition-all duration-300 flex items-end justify-center"
        :style="{ height: whitePercentage + '%' }"
      >
        <span 
          v-if="evaluation && whitePercentage > 15" 
          class="text-xs font-bold text-gray-800 pb-2"
        >
          {{ displayScore }}
        </span>
      </div>

      <!-- Black advantage (top) -->
      <div 
        class="bg-gray-900 transition-all duration-300 flex items-start justify-center"
        :style="{ height: blackPercentage + '%' }"
      >
        <span 
          v-if="evaluation && blackPercentage > 15" 
          class="text-xs font-bold text-gray-100 pt-2"
        >
          {{ displayScore }}
        </span>
      </div>

      <!-- Center line -->
      <div class="absolute top-1/2 left-0 right-0 h-px bg-gray-600 transform -translate-y-1/2"></div>
    </div>

    <!-- Loading indicator -->
    <div 
      v-if="isAnalyzing" 
      class="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  evaluation: {
    type: Object,
    default: null
  },
  isAnalyzing: {
    type: Boolean,
    default: false
  },
  openingName: {
    type: String,
    default: ''
  }
});

const displayScore = computed(() => {
  if (!props.evaluation) return '';
  
  const { score, scoreType } = props.evaluation;
  
  if (scoreType === 'mate') {
    return `M${Math.abs(score)}`;
  }
  
  return (score / 100).toFixed(1);
});

const whitePercentage = computed(() => {
  if (!props.evaluation) return 50;
  
  const { score, scoreType } = props.evaluation;
  
  if (scoreType === 'mate') {
    return score > 0 ? 100 : 0;
  }
  
  const normalized = Math.max(-500, Math.min(500, score));
  return 50 + (normalized / 10);
});

const blackPercentage = computed(() => {
  return 100 - whitePercentage.value;
});
</script>
```

**Props:**
```javascript
{
  evaluation: {
    type: Object,
    default: null
  },
  isAnalyzing: {
    type: Boolean,
    default: false
  },
  openingName: {
    type: String,
    default: ''
  }
}
```

**Visual Specifications:**
- **Width:** 48px (w-12)
- **Height:** Full height of board
- **Colors:**
  - White advantage: bg-gray-100
  - Black advantage: bg-gray-900
  - Background: bg-gray-800
- **Layout:** Vertical bar, white at bottom, black at top
- **Score Display:**
  - Show numeric score when segment > 15% height
  - Mate scores: "M5" format
  - Centipawn scores: "1.5" format (pawns, 1 decimal)
- **Opening Name:** Rotated 90° vertically on left side
- **Loading State:** Spinning indicator overlay when analyzing

**Score to Height Calculation:**
- 0 centipawns = 50% white, 50% black
- +500 centipawns (5 pawns) = 100% white
- -500 centipawns = 100% black
- Cap evaluation at ±500 for visualization
- Mate scores: 100% or 0%

**Transitions:** Smooth height changes with 300ms duration

---

### 6. Pinia Store Updates

**File:** `src/stores/game.js`

**Add to existing store:**

```javascript
import { defineStore } from 'pinia';
import { Chess } from 'chess.js';
import axios from 'axios';
import openings from '@/data/openings.json';

export const useGameStore = defineStore('game', {
  state: () => ({
    chess: new Chess(),
    // ... your existing state ...
    evaluations: {},
    currentGameId: null,
    analysisDepth: 15,
  }),

  getters: {
    currentFen: (state) => state.chess.fen(),
    
    currentEvaluation: (state) => {
      const fen = state.chess.fen();
      return state.evaluations[fen] || null;
    },
    
    currentOpening: (state) => {
      const fen = state.chess.fen();
      return openings[fen] || null;
    },
    
    // ... your existing getters ...
  },

  actions: {
    setEvaluation(fen, evaluation) {
      this.evaluations[fen] = evaluation;
    },

    async loadEvaluations(gameId) {
      try {
        const response = await axios.get(`/api/games/${gameId}/evaluations`);
        this.evaluations = response.data.evaluations || {};
        this.currentGameId = gameId;
      } catch (error) {
        console.error('Failed to load evaluations:', error);
      }
    },

    async saveEvaluations() {
      if (!this.currentGameId) return;
      
      try {
        await axios.post(`/api/games/${this.currentGameId}/evaluations`, {
          evaluations: this.evaluations
        });
      } catch (error) {
        console.error('Failed to save evaluations:', error);
      }
    },

    async loadUserSettings() {
      try {
        const response = await axios.get('/api/settings');
        this.analysisDepth = response.data.analysisDepth;
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    },

    async updateAnalysisDepth(depth) {
      try {
        await axios.patch('/api/settings', { analysisDepth: depth });
        this.analysisDepth = depth;
      } catch (error) {
        console.error('Failed to update settings:', error);
      }
    },

    // ... your existing actions ...
  }
});
```

**New State:**
```javascript
{
  evaluations: {},      // Object: { fen: Evaluation }
  currentGameId: null,  // String | null
  analysisDepth: 15     // Number
}
```

**New Getters:**
```javascript
{
  currentFen: (state) => string,
  currentEvaluation: (state) => Evaluation | null,
  currentOpening: (state) => { name: string, eco: string } | null
}
```

**New Actions:**
```javascript
{
  setEvaluation(fen, evaluation),
  async loadEvaluations(gameId),
  async saveEvaluations(),
  async loadUserSettings(),
  async updateAnalysisDepth(depth)
}
```

**Opening Lookup Logic:**
- Import openings.json at top of file
- Direct FEN lookup in openings object
- Return null if not found

**Auto-save Strategy:**
- Save evaluations after each new analysis
- Debounce to avoid excessive API calls (optional enhancement)

---

### 7. Board Component Updates

**File:** `src/components/Board.vue`

**Template Changes:**
```vue
<template>
  <div class="flex gap-4">
    <EvaluationBar 
      :evaluation="gameStore.currentEvaluation"
      :is-analyzing="isAnalyzing"
      :opening-name="gameStore.currentOpening?.name"
    />
    
    <!-- Existing board markup -->
    <div class="chess-board">
      <!-- ... your existing board code ... -->
    </div>
  </div>
</template>
```

**Script Setup:**
```vue
<script setup>
import { ref, watch, onMounted } from 'vue';
import { useGameStore } from '@/stores/game';
import { useStockfish } from '@/composables/useStockfish';
import EvaluationBar from './EvaluationBar.vue';

const gameStore = useGameStore();
const { initEngine, analyzePosition, isAnalyzing, isReady } = useStockfish();

onMounted(async () => {
  await initEngine();
  await gameStore.loadUserSettings();
  
  if (isReady.value) {
    analyzeCurrentPosition();
  }
});

watch(() => gameStore.currentFen, async (newFen) => {
  if (gameStore.evaluations[newFen]) {
    return; // Use cached evaluation
  }
  
  if (isReady.value) {
    analyzeCurrentPosition();
  }
});

const analyzeCurrentPosition = async () => {
  const fen = gameStore.currentFen;
  const evaluation = await analyzePosition(fen, gameStore.analysisDepth);
  
  if (evaluation) {
    gameStore.setEvaluation(fen, evaluation);
    await gameStore.saveEvaluations();
  }
};

// ... rest of your existing Board.vue code ...
</script>
```

**New Imports:**
```javascript
import EvaluationBar from './EvaluationBar.vue';
import { useStockfish } from '@/composables/useStockfish';
```

**Logic Flow:**
1. Initialize Stockfish engine on component mount
2. Load user settings (analysis depth)
3. Analyze initial position
4. Watch `currentFen` for changes
5. Check if evaluation cached before analyzing
6. Auto-save evaluations after analysis

**Watch Behavior:**
```javascript
watch(() => gameStore.currentFen, async (newFen) => {
  if (gameStore.evaluations[newFen]) {
    return; // Use cached
  }
  if (isReady.value) {
    await analyzeCurrentPosition();
  }
});
```

---

### 8. Settings Page Updates

**File:** `src/views/Settings.vue`

**Template Addition:**
```vue
<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Settings</h1>

    <!-- Analysis Depth Setting -->
    <div class="bg-white rounded-lg shadow p-6 mb-4">
      <h2 class="text-lg font-semibold mb-4">Analysis Settings</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Analysis Depth: {{ gameStore.analysisDepth }}
          </label>
          <input
            type="range"
            min="8"
            max="25"
            v-model.number="gameStore.analysisDepth"
            @change="saveDepth"
            class="w-full"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Fast (8)</span>
            <span>Balanced (15)</span>
            <span>Deep (25)</span>
          </div>
        </div>

        <div class="text-sm text-gray-600">
          <p><strong>Depth 8-12:</strong> Quick analysis (~1-2 seconds)</p>
          <p><strong>Depth 13-18:</strong> Balanced (~3-8 seconds)</p>
          <p><strong>Depth 19-25:</strong> Deep analysis (~10-30 seconds)</p>
        </div>
      </div>
    </div>

    <!-- ... your existing settings sections ... -->
  </div>
</template>
```

**Script Setup:**
```vue
<script setup>
import { useGameStore } from '@/stores/game';
import { onMounted } from 'vue';

const gameStore = useGameStore();

onMounted(async () => {
  await gameStore.loadUserSettings();
});

const saveDepth = async () => {
  await gameStore.updateAnalysisDepth(gameStore.analysisDepth);
};
</script>
```

**Depth Guidelines Display:**
- 8-12: Fast (~1-2 seconds)
- 13-18: Balanced (~3-8 seconds)  
- 19-25: Deep (~10-30 seconds)

**Script Logic:**
- Load settings on mount
- Save to API on slider change
- Update store immediately for responsive UI

---

## Data Flow Diagram

```
User Action (Move Through Game)
    ↓
Board.vue detects FEN change
    ↓
Check Pinia store for cached evaluation
    ↓
If not cached:
    ↓
useStockfish.analyzePosition(fen, depth)
    ↓
Stockfish WASM analyzes position
    ↓
Evaluation returned to Board.vue
    ↓
Store in Pinia (setEvaluation)
    ↓
Auto-save to PostgreSQL via API
    ↓
EvaluationBar component updates (reactive)
```

---

## Testing Requirements

### Unit Testing
- [ ] Stockfish composable initialization
- [ ] FEN to evaluation conversion
- [ ] Opening lookup from JSON
- [ ] Score to percentage calculation

### Integration Testing
- [ ] API endpoints (all 4)
- [ ] Database CRUD operations
- [ ] Evaluation persistence across sessions

### E2E Testing
1. **Load Game & Analyze**
   - Load existing game
   - Verify evaluation bar appears
   - Step through moves
   - Confirm evaluations update in real-time

2. **Settings Persistence**
   - Change analysis depth in settings
   - Navigate to game view
   - Verify new depth is used
   - Reload page
   - Confirm setting persists

3. **Caching Behavior**
   - Analyze position
   - Navigate away and back
   - Verify no re-analysis (uses cache)
   - Check database for stored evaluation

4. **Opening Detection**
   - Start new game with common opening
   - Verify opening name displays
   - Play through opening moves
   - Confirm name updates appropriately

---

## Performance Considerations

### Client-Side
- Stockfish WASM uses one CPU core
- Mobile devices will be slower than desktop
- Deeper analysis blocks UI thread (use Web Workers in future enhancement)
- Opening JSON file: ~500KB initial load

### Server-Side
- Evaluations stored as JSON blob (no indexing needed)
- Keep evaluation saves async to avoid blocking
- Consider debouncing saves if user rapidly steps through moves

### Database
- JSON column for flexibility
- Single UPDATE query per save
- Index on gameId for fast lookups

---

## Future Enhancements (Out of Scope)

1. **Best Move Visualization**
   - Draw arrows showing engine's suggested move
   - Highlight squares involved in best line

2. **Multi-PV Analysis**
   - Show top 3 candidate moves
   - Display evaluation for each line

3. **Accuracy Scoring**
   - Compare played moves vs engine recommendations
   - Generate accuracy percentage per game

4. **Opening Explorer**
   - Show statistics for current position
   - Link to master games database

5. **Web Workers**
   - Move Stockfish to worker thread
   - Prevent UI blocking during deep analysis

6. **Cloud Engine Option**
   - Toggle between local and cloud analysis
   - For users wanting stronger/faster analysis

---

## Deployment Checklist

### Backend
- [ ] Run Prisma migration: `npx prisma migrate deploy`
- [ ] Verify new API routes registered
- [ ] Test authentication on new endpoints
- [ ] Check database permissions for JSON column

### Frontend
- [ ] Install stockfish.wasm: `npm install stockfish.wasm`
- [ ] Add openings.json to src/data/
- [ ] Build and test locally
- [ ] Verify WASM loading in production build
- [ ] Test on target browsers (Chrome, Firefox, Safari)

### Environment Variables
- No new environment variables required
- Uses existing JWT and database configuration

---

## Rollback Plan

If issues arise post-deployment:

1. **Frontend:** Remove EvaluationBar from Board.vue template
2. **Backend:** API routes are additive, won't break existing functionality
3. **Database:** Evaluations column is nullable, can be ignored
4. **Full Rollback:** 
   ```bash
   git revert <commit-hash>
   npx prisma migrate rollback
   ```

---

## Support & Documentation

### For Developers
- Stockfish.js documentation: https://github.com/nmrugg/stockfish.js
- chess.js API: https://github.com/jhlywa/chess.js
- Prisma docs: https://www.prisma.io/docs

### For Users
- Update help documentation to explain:
  - Evaluation bar meaning
  - How to adjust analysis depth
  - Performance impact of depth settings

---

## Acceptance Criteria

✅ **Must Have:**
- Evaluation bar visible next to chess board
- Real-time updates as user steps through game
- Opening names display for recognized positions
- User can configure analysis depth (8-25)
- Evaluations persist in database
- No breaking changes to existing features

✅ **Should Have:**
- Analysis completes within documented time ranges
- Smooth visual transitions on evaluation bar
- Loading indicator during analysis
- Settings save without page reload

✅ **Nice to Have:**
- Cached evaluations load instantly
- Mobile-friendly evaluation display
- Helpful tooltips for settings

---

## Glossary

- **FEN**: Forsyth-Edwards Notation - standard chess position format
- **UCI**: Universal Chess Interface - protocol for chess engines
- **Centipawns**: 1/100th of a pawn (100 centipawns = 1 pawn advantage)
- **WASM**: WebAssembly - binary instruction format for browsers
- **ECO**: Encyclopedia of Chess Openings - standard opening classification
- **Depth**: Number of moves ahead the engine calculates (ply)

---

**End of Document**
