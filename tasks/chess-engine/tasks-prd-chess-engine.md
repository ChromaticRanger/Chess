# Task List: Chess Engine Integration

Based on PRD: `docs/chess-engine-integration-prd.md`

## Relevant Files

### Backend
- `backend/prisma/schema.prisma` - Database schema with evaluations and UserSettings
- `backend/src/routes/settings.js` - User settings API routes (new)
- `backend/src/routes/games.js` - Extended with evaluations endpoints
- `backend/src/index.js` - Route registration

### Frontend
- `src/data/openings.json` - Chess opening book data (new)
- `src/composables/useStockfish.js` - Stockfish WASM integration (new)
- `src/components/EvaluationBar.vue` - Evaluation display component (new)
- `src/stores/game.js` - Extended with evaluation state
- `src/components/Board.vue` - Integrated with evaluation bar
- `src/views/Settings.vue` - Implemented with analysis depth setting

### Configuration
- `package.json` - stockfish.wasm dependency

---

## Tasks

- [x] **1.0 Database Schema & Migration**
  - [x] 1.1 Add `evaluations Json?` field to Game model in schema.prisma
  - [x] 1.2 Create UserSettings model with analysisDepth field
  - [x] 1.3 Add UserSettings relation to User model
  - [x] 1.4 Run prisma migration
  - [x] 1.5 Verify migration with Prisma Studio

- [x] **2.0 Backend Settings API**
  - [x] 2.1 Create settings.js routes file with Hono router
  - [x] 2.2 Implement GET /api/settings endpoint with default creation
  - [x] 2.3 Implement PATCH /api/settings endpoint
  - [x] 2.4 Register routes in backend/src/index.js
  - [x] 2.5 Test endpoints manually

- [x] **3.0 Backend Evaluations API**
  - [x] 3.1 Add GET /api/games/:gameId/evaluations endpoint
  - [x] 3.2 Add POST /api/games/:gameId/evaluations endpoint
  - [x] 3.3 Test endpoints manually

- [x] **4.0 Opening Book Data**
  - [x] 4.1 Create src/data directory if not exists
  - [x] 4.2 Create openings.json with common opening positions

- [x] **5.0 Stockfish Composable**
  - [x] 5.1 Install stockfish.wasm npm package
  - [x] 5.2 Create useStockfish.js composable with engine initialization
  - [x] 5.3 Implement analyzePosition with UCI protocol parsing
  - [x] 5.4 Implement stopAnalysis and terminate functions
  - [x] 5.5 Test engine initialization and basic analysis

- [x] **6.0 Evaluation Bar Component**
  - [x] 6.1 Create EvaluationBar.vue with basic structure
  - [x] 6.2 Implement score to percentage calculation
  - [x] 6.3 Add loading spinner and opening name display
  - [x] 6.4 Style with Tailwind CSS

- [x] **7.0 Game Store Updates**
  - [x] 7.1 Import openings.json and add evaluation state
  - [x] 7.2 Add currentEvaluation and currentOpening computed getters
  - [x] 7.3 Implement evaluation actions (set, load, save)
  - [x] 7.4 Implement settings actions (load, update)

- [x] **8.0 Board Component Integration**
  - [x] 8.1 Import EvaluationBar and useStockfish
  - [x] 8.2 Update template with flex wrapper and EvaluationBar
  - [x] 8.3 Initialize engine on mount and watch FEN for analysis
  - [x] 8.4 Implement evaluation caching and auto-save

- [x] **9.0 Settings Page Implementation**
  - [x] 9.1 Replace placeholder with analysis depth slider
  - [x] 9.2 Implement load/save settings functionality
  - [x] 9.3 Style with Tailwind CSS

- [x] **10.0 Testing & Verification**
  - [x] 10.1 Test evaluation bar with various scores
  - [x] 10.2 Test opening detection with common openings
  - [x] 10.3 Test evaluation persistence across sessions
  - [x] 10.4 Test responsive design
