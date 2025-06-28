# Task List: Fix Move History List Position Synchronization

Based on PRD: `prd-move-list.md`

## Relevant Files

### Frontend (Vue)
- `src/components/MoveHistoryList.vue` - Move history component with index calculation functions
- `src/stores/game.js` - Game state management with viewMoveAtIndex function
- `src/components/Board.vue` - Chess board component consuming currentFen
- `src/components/MoveControlPanel.vue` - Navigation controls for move history
- `src/components/BoardStatusPanel.vue` - Status panel showing "Viewing Past Moves" label

### Testing Files
- `src/tests/MoveHistorySync.test.js` - New test file for move history synchronization
- Manual testing scenarios for move navigation

### Notes
- This is a frontend-only bug fix, no backend or database changes required
- Focus on index calculation logic and state synchronization
- Preserve existing Tailwind styling and Vue Composition API patterns
- Maintain compatibility with existing move control features

## Tasks

- [x] **1.0 Root Cause Analysis & Investigation**
  - [x] 1.1 Examine current `getWhiteMoveIndex` and `getBlackMoveIndex` functions in MoveHistoryList.vue
  - [x] 1.2 Trace the flow from move click → `selectMove` → `viewMoveAtIndex` → board position display
  - [x] 1.3 Test current behavior: document exactly which positions are shown for specific move clicks
  - [x] 1.4 Analyze the `viewMoveAtIndex` function in game.js store to understand move replay logic
  - [x] 1.5 Identify whether the issue is in index calculation, move replay, or both
  - [x] 1.6 Create a mapping document showing expected vs actual behavior for first 5 moves

- [x] **2.0 Index Calculation Fix**
  - [x] 2.1 Fix `getWhiteMoveIndex(moveNumber)` function to return correct index for post-move position
  - [x] 2.2 Fix `getBlackMoveIndex(moveNumber)` function to return correct index for post-move position
  - [x] 2.3 Update `selectMove(moveIndex)` function if needed to pass correct parameters
  - [x] 2.4 Verify index calculations work for both white and black moves consistently
  - [x] 2.5 Test edge cases: first move (index 0), last move, and moves in between
  - [x] 2.6 Ensure index calculations align with moveHistory array structure

- [x] **3.0 Game Store Synchronization**
  - [x] 3.1 Review and fix `viewMoveAtIndex(index)` function in game.js to show post-move positions
  - [x] 3.2 Ensure move replay logic correctly builds position after the specified move
  - [x] 3.3 Verify `tempBoardState` is set to the correct FEN after move replay
  - [x] 3.4 Test that `currentFen` computed property returns the right value when viewing history
  - [x] 3.5 Ensure `viewingMoveIndex` state correctly tracks the selected move
  - [x] 3.6 Validate that returning to current position (-1 index) works properly

- [x] **4.0 Visual Feedback & Highlighting**
  - [x] 4.1 Verify move highlighting works with corrected index calculations
  - [x] 4.2 Test that `currentMoveIndex` prop correctly identifies the selected move
  - [x] 4.3 Ensure highlighting uses correct comparison logic for both white and black moves
  - [x] 4.4 Validate that only one move is highlighted at a time
  - [x] 4.5 Test that highlighting is removed when returning to current position
  - [x] 4.6 Ensure existing Tailwind classes (`bg-blue-100`) continue to work properly

- [ ] **5.0 Navigation Integration Testing**
  - [x] 5.1 Test that MoveControlPanel next/previous buttons work with fixed indices
  - [ ] 5.2 Verify "Go to last move" button returns to actual current position
  - [ ] 5.3 Test that move navigation maintains correct highlighting
  - [ ] 5.4 Ensure "Viewing Past Moves" label appears/disappears correctly
  - [ ] 5.5 Validate that move-making is disabled when viewing historical positions
  - [ ] 5.6 Test integration between MoveHistoryList clicks and MoveControlPanel navigation

- [ ] **6.0 Edge Case Handling & Validation**
  - [ ] 6.1 Test clicking on the very first move vs initial position handling
  - [ ] 6.2 Test rapid clicking between different moves for performance/stability
  - [ ] 6.3 Test clicking on the same move that's already selected
  - [ ] 6.4 Test behavior with games of different lengths (short games, long games)
  - [ ] 6.5 Test with games that have special moves (castling, en passant, promotion)
  - [ ] 6.6 Validate that console shows no errors during move history navigation
  - [ ] 6.7 Test that all acceptance criteria from PRD are met
  - [ ] 6.8 Create comprehensive test scenarios document for future regression testing

## Current vs Expected Behavior Analysis

### Current Index Calculation:
- `getWhiteMoveIndex(moveNumber)` = `(moveNumber-1)*2`
- `getBlackMoveIndex(moveNumber)` = `(moveNumber-1)*2 + 1`

### Current Behavior (INCORRECT):
```
Click Target                | Index Sent | viewMoveAtIndex Logic        | Position Shown
White Move 1 (e4)          | 0          | Replays 0 moves             | Initial position (before e4)
Black Move 1 (...e5)       | 1          | Replays 1 move (e4)         | After e4, before e5
White Move 2 (Nf3)         | 2          | Replays 2 moves (e4, e5)    | After e5, before Nf3
Black Move 2 (...Nc6)      | 3          | Replays 3 moves             | After Nf3, before Nc6
White Move 3 (Bc4)         | 4          | Replays 4 moves             | After Nc6, before Bc4
```

### Expected Behavior (CORRECT):
```
Click Target                | Index Needed | viewMoveAtIndex Logic        | Position Shown
White Move 1 (e4)          | 1           | Replays 1 move (e4)         | After e4
Black Move 1 (...e5)       | 2           | Replays 2 moves (e4, e5)    | After e5
White Move 2 (Nf3)         | 3           | Replays 3 moves             | After Nf3
Black Move 2 (...Nc6)      | 4           | Replays 4 moves             | After Nc6
White Move 3 (Bc4)         | 5           | Replays 5 moves             | After Bc4
```

### Index Mapping Table:
```
Move Number | Current White | Current Black | Correct White | Correct Black
1           | 0             | 1             | 1             | 2
2           | 2             | 3             | 3             | 4
3           | 4             | 5             | 5             | 6
```

### viewMoveAtIndex Function Analysis:

**Function Logic (CORRECT):**
- `viewMoveAtIndex(0)`: Shows initial position (no moves replayed)
- `viewMoveAtIndex(1)`: Replays moveHistory[0], shows position after 1st move
- `viewMoveAtIndex(2)`: Replays moveHistory[0-1], shows position after 2nd move
- `viewMoveAtIndex(n)`: Replays moveHistory[0 to n-1], shows position after nth move

**Key Implementation Details:**
- Creates temporary Chess instance starting from initial position
- For loop: `for (let i = 0; i < index; i++)` replays moves 0 through (index-1)
- Sets `tempBoardState.value` to the resulting FEN
- `currentFen` computed property returns `tempBoardState.value || fen.value`

**Function is Working Correctly:**
The `viewMoveAtIndex` function logic is correct and working as intended. The issue is purely in the index calculation functions that call it.

## Root Cause Identification

**✅ CONFIRMED: Issue is in Index Calculation ONLY**

**Analysis Summary:**
1. **`viewMoveAtIndex` function**: ✅ Working correctly
   - Properly replays moves and sets board position
   - Correctly interprets index as "number of moves to replay"
   - Integration with `currentFen` computed property works as expected

2. **Index calculation functions**: ❌ Off by 1 error
   - `getWhiteMoveIndex(moveNumber)` returns `(moveNumber-1)*2` 
   - `getBlackMoveIndex(moveNumber)` returns `(moveNumber-1)*2 + 1`
   - These return move array indices instead of "moves to replay" count

**Fix Strategy:**
- Add +1 to both index calculation functions
- No changes needed to `viewMoveAtIndex` or any other components
- Simple, targeted fix with minimal risk

## Comprehensive Behavior Mapping for First 5 Moves

### Sample Game Sequence:
```
1. e4 e5
2. Nf3 Nc6  
3. Bc4 ...
```

### Detailed Current vs Expected Behavior:

| Move | Click Target | Current Index | Current Position Shown | Expected Index | Expected Position Shown | Status |
|------|-------------|---------------|----------------------|----------------|------------------------|---------|
| 1 | White: e4 | 0 | Initial position (rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR) | 1 | After e4 (rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR) | ❌ WRONG |
| 1 | Black: e5 | 1 | After e4 (rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR) | 2 | After e5 (rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR) | ❌ WRONG |
| 2 | White: Nf3 | 2 | After e5 (rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR) | 3 | After Nf3 (rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R) | ❌ WRONG |
| 2 | Black: Nc6 | 3 | After Nf3 (rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R) | 4 | After Nc6 (r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R) | ❌ WRONG |
| 3 | White: Bc4 | 4 | After Nc6 (r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R) | 5 | After Bc4 (r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R) | ❌ WRONG |

### Index Calculation Formulas:

**Current (INCORRECT):**
```javascript
getWhiteMoveIndex(moveNumber) = (moveNumber-1)*2        // Returns: 0, 2, 4, 6, 8...
getBlackMoveIndex(moveNumber) = (moveNumber-1)*2 + 1    // Returns: 1, 3, 5, 7, 9...
```

**Required (CORRECT):**
```javascript
getWhiteMoveIndex(moveNumber) = (moveNumber-1)*2 + 1    // Should return: 1, 3, 5, 7, 9...
getBlackMoveIndex(moveNumber) = (moveNumber-1)*2 + 2    // Should return: 2, 4, 6, 8, 10...
```

### Move History Array Structure:
```
moveHistory[0] = {san: "e4", from: "e2", to: "e4", ...}     // White Move 1
moveHistory[1] = {san: "e5", from: "e7", to: "e5", ...}     // Black Move 1  
moveHistory[2] = {san: "Nf3", from: "g1", to: "f3", ...}    // White Move 2
moveHistory[3] = {san: "Nc6", from: "b8", to: "c6", ...}    // Black Move 2
moveHistory[4] = {san: "Bc4", from: "f1", to: "c4", ...}    // White Move 3
```

### Validation Rules:
- Clicking on White Move N should show position after moveHistory[2N-2]
- Clicking on Black Move N should show position after moveHistory[2N-1]
- viewMoveAtIndex(X) should replay moveHistory[0] through moveHistory[X-1]

## Index Calculation Verification

### Fixed Formula Testing:
| Move | Formula | Result | Target moveHistory | Replays | Position Shown |
|------|---------|--------|-------------------|----------|----------------|
| White 1 | (1-1)*2+1 | 1 | moveHistory[0] | moveHistory[0] | After e4 ✅ |
| Black 1 | (1-1)*2+2 | 2 | moveHistory[1] | moveHistory[0-1] | After e5 ✅ |
| White 2 | (2-1)*2+1 | 3 | moveHistory[2] | moveHistory[0-2] | After Nf3 ✅ |
| Black 2 | (2-1)*2+2 | 4 | moveHistory[3] | moveHistory[0-3] | After Nc6 ✅ |
| White 3 | (3-1)*2+1 | 5 | moveHistory[4] | moveHistory[0-4] | After Bc4 ✅ |
| Black 3 | (3-1)*2+2 | 6 | moveHistory[5] | moveHistory[0-5] | After Nf6 ✅ |

### Pattern Consistency Check:
- **White moves**: Return odd indices (1, 3, 5, 7, 9...) ✅
- **Black moves**: Return even indices (2, 4, 6, 8, 10...) ✅  
- **Sequential**: Black move N always follows White move N (N*2 vs N*2+1) ✅
- **No gaps**: Every moveHistory position is covered ✅

## Edge Case Testing

### Edge Case 1: First Move
- **White Move 1**: `getWhiteMoveIndex(1)` = `(1-1)*2+1` = 1 ✅
  - `viewMoveAtIndex(1)` replays moveHistory[0] → Shows position after e4
  - **Result**: Correctly shows first white move position
- **Black Move 1**: `getBlackMoveIndex(1)` = `(1-1)*2+2` = 2 ✅  
  - `viewMoveAtIndex(2)` replays moveHistory[0-1] → Shows position after e5
  - **Result**: Correctly shows first black move position

### Edge Case 2: Single Move Game
- **moveHistory.length = 1** (only e4 played)
- **White Move 1**: Index 1, `viewMoveAtIndex(1)` ✅ Valid
- **Black Move 1**: Index 2, but moveHistory[1] doesn't exist
  - `viewMoveAtIndex(2)` would try to replay 2 moves from 1-move history
  - **Handled by**: `viewMoveAtIndex` validation: `index > moveHistory.length` → Warning & return

### Edge Case 3: Last Move in Game
- **moveHistory.length = 10** (5 full moves)
- **White Move 5**: `getWhiteMoveIndex(5)` = `(5-1)*2+1` = 9 ✅
  - `viewMoveAtIndex(9)` replays moveHistory[0-8] → Valid
- **Black Move 5**: `getBlackMoveIndex(5)` = `(5-1)*2+2` = 10 ✅
  - `viewMoveAtIndex(10)` replays moveHistory[0-9] → Shows current position

### Edge Case 4: Incomplete Last Move
- **moveHistory.length = 9** (4.5 moves - white played, black hasn't)
- **White Move 5**: Index 9, `viewMoveAtIndex(9)` replays 9 moves ✅ Valid
- **Black Move 5**: Index 10, but only 9 moves exist
  - **Handled by**: Template logic - Black Move 5 won't be displayed since `moves.black` would be null

### Edge Case 5: Index Boundary Testing
- **Index 0**: `viewMoveAtIndex(0)` → Shows initial position ✅
- **Index 1**: `viewMoveAtIndex(1)` → Shows after first move ✅
- **Index = moveHistory.length**: Shows current position ✅
- **Index > moveHistory.length**: Validation prevents, function returns early ✅

### Edge Case 6: Empty Game
- **moveHistory.length = 0** (no moves played)
- **No moves to click**: Template shows "No moves yet" ✅
- **Navigation**: Only current position (-1) available ✅

## moveHistory Array Structure Alignment

### Array Structure Analysis:
```javascript
// Standard chess game progression:
moveHistory[0] = {san: "e4", ...}     // White Move 1  
moveHistory[1] = {san: "e5", ...}     // Black Move 1
moveHistory[2] = {san: "Nf3", ...}    // White Move 2
moveHistory[3] = {san: "Nc6", ...}    // Black Move 2
moveHistory[4] = {san: "Bc4", ...}    // White Move 3
moveHistory[5] = {san: "Nf6", ...}    // Black Move 3
```

### Index Calculation Alignment Verification:

| UI Element | moveNumber | Array Position | Calculation | Result | viewMoveAtIndex(Result) | ✅ |
|------------|------------|----------------|-------------|--------|------------------------|---|
| White Move 1 | 1 | moveHistory[0] | (1-1)*2+1 | 1 | Replays moveHistory[0] | ✅ |
| Black Move 1 | 1 | moveHistory[1] | (1-1)*2+2 | 2 | Replays moveHistory[0-1] | ✅ |
| White Move 2 | 2 | moveHistory[2] | (2-1)*2+1 | 3 | Replays moveHistory[0-2] | ✅ |
| Black Move 2 | 2 | moveHistory[3] | (2-1)*2+2 | 4 | Replays moveHistory[0-3] | ✅ |
| White Move 3 | 3 | moveHistory[4] | (3-1)*2+1 | 5 | Replays moveHistory[0-4] | ✅ |
| Black Move 3 | 3 | moveHistory[5] | (3-1)*2+2 | 6 | Replays moveHistory[0-5] | ✅ |

### Mathematical Verification:
- **White Move N**: Targets `moveHistory[(N-1)*2]` → Calculation yields `(N-1)*2+1` → `viewMoveAtIndex` replays 0 to `(N-1)*2` ✅
- **Black Move N**: Targets `moveHistory[(N-1)*2+1]` → Calculation yields `(N-1)*2+2` → `viewMoveAtIndex` replays 0 to `(N-1)*2+1` ✅

### Data Flow Verification:
1. **Template Layer**: `moveNumber` from `formattedMoveHistoryByNumber` 
2. **Calculation Layer**: Index functions convert `moveNumber` to replay count
3. **Store Layer**: `viewMoveAtIndex` replays moves from `moveHistory[0]` to `moveHistory[index-1]`
4. **Result**: Board shows position after the clicked move ✅

### Boundary Condition Alignment:
- **Minimum**: `moveNumber = 1` → Indices 1,2 → All valid ✅
- **Maximum**: `moveNumber = moveHistory.length/2` → All indices ≤ `moveHistory.length` ✅
- **Incomplete Pairs**: Black moves only exist when `moveHistory.length` is even ✅

### Array Access Safety:
- **No Direct Access**: Index functions never directly access `moveHistory` array ✅  
- **Validation Layer**: `selectMove` validates indices before passing to store ✅
- **Store Validation**: `viewMoveAtIndex` validates indices before array access ✅
- **Bounds Checking**: All access patterns stay within array bounds ✅

## Game Store Function Analysis

### viewMoveAtIndex Function Review:

**✅ Function Logic is CORRECT:**
```javascript
// Key logic from viewMoveAtIndex:
for (let i = 0; i < index; i++) {
  const move = moveHistory.value[i];
  tempChess.move(move);  // Apply move to temporary board
}
tempBoardState.value = tempChess.fen();  // Set final position
```

**✅ Post-Move Position Logic:**
- **Index 1**: Replays moveHistory[0] → Shows position after 1st move ✅
- **Index 2**: Replays moveHistory[0-1] → Shows position after 2nd move ✅  
- **Index N**: Replays moveHistory[0 to N-1] → Shows position after Nth move ✅

**✅ Special Cases Handled Correctly:**
- **Index -1**: Returns to current game position ✅
- **Index 0**: Shows initial position (no moves replayed) ✅
- **Invalid indices**: Proper validation and early return ✅

**✅ Error Handling:**
- Validates index range before processing ✅
- Checks array bounds during replay loop ✅
- Handles chess.js move failures gracefully ✅
- Comprehensive logging for debugging ✅

**✅ State Management:**
- Sets `tempBoardState.value` to correct FEN ✅
- Updates `viewingMoveIndex.value` to track position ✅
- `currentFen` computed property returns `tempBoardState || fen` ✅

**✅ Integration with Fixed Index Calculations:**
- Now receives correct indices from fixed calculation functions ✅
- Index 1,3,5... (white moves) correctly show post-white-move positions ✅
- Index 2,4,6... (black moves) correctly show post-black-move positions ✅

**Conclusion: NO CHANGES NEEDED**
The `viewMoveAtIndex` function was already implemented correctly. The issue was entirely in the index calculation functions, which have now been fixed.

## Move Replay Logic Analysis

### Replay Mechanism Review:

**✅ Core Replay Logic:**
```javascript
for (let i = 0; i < index; i++) {
  const move = moveHistory.value[i];
  const result = tempChess.move({
    from: move.from,
    to: move.to, 
    promotion: move.promotion ? move.promotion.toLowerCase().charAt(0) : undefined,
  });
}
```

**✅ Move Data Completeness:**
- **from/to**: Square coordinates stored correctly ✅
- **promotion**: Full piece name stored, converted to chess.js format during replay ✅
- **Data source**: All data comes from chess.js result object ✅

**✅ Promotion Handling:**
- **Storage**: `promotion: "Queen"` (full name from pieceCodeToName mapping)
- **Replay**: `promotion: "queen".charAt(0)` → "q" (chess.js format) ✅
- **Conversion**: Correctly handles case and format differences ✅

**✅ Special Move Support:**
- **Castling**: Handled by from/to coordinates ✅
- **En Passant**: Handled by from/to coordinates ✅  
- **Promotion**: Explicit promotion parameter ✅
- **Regular Moves**: Standard from/to handling ✅

**✅ Error Handling in Replay:**
- **Invalid moves**: `tempChess.move()` returns null, breaks loop ✅
- **Array bounds**: Checks `i >= moveHistory.length` ✅
- **Success tracking**: `success` variable tracks replay status ✅
- **Logging**: Comprehensive move-by-move logging ✅

**✅ Sequential Integrity:**
- **Order preservation**: Replays moves in exact storage order ✅
- **State building**: Each move builds on previous position ✅
- **Chess rules**: chess.js validates each move during replay ✅

**Conclusion: REPLAY LOGIC IS CORRECT**
The move replay mechanism correctly builds positions after the specified number of moves. All move types are handled properly with appropriate format conversions.

## tempBoardState Management Verification

### State Setting Analysis:

**✅ State Definition:**
```javascript
const tempBoardState = ref(null);  // Reactive reference for temporary board positions
```

**✅ FEN Setting Logic:**
```javascript
// After successful move replay:
if (success) {
  tempBoardState.value = tempChess.fen();  // Set to exact position after replayed moves
  viewingMoveIndex.value = index;          // Track which position is being viewed
}
```

**✅ Special Cases Handled:**
- **Current Position (index -1)**: `tempBoardState.value = null` → Uses actual game FEN ✅
- **Initial Position (index 0)**: `tempBoardState.value = tempChess.fen()` → Shows starting position ✅
- **Historical Positions**: `tempBoardState.value = tempChess.fen()` → Shows exact replay result ✅

**✅ State Integrity:**
- **Source**: FEN comes directly from chess.js after validated move replay ✅
- **Timing**: Set only after successful replay completion ✅
- **Accuracy**: Represents exact board state after specified number of moves ✅
- **Isolation**: Doesn't affect actual game state (fen.value) ✅

**✅ Error Handling:**
- **Failed Replay**: tempBoardState remains unchanged if replay fails ✅
- **Invalid Index**: Function returns early, no state changes ✅
- **Success Tracking**: Only updates state when `success === true` ✅

**✅ State Lifecycle:**
- **Set**: When viewing historical position (index ≥ 0) ✅
- **Cleared**: When returning to current position (index -1) ✅
- **Preserved**: Maintains value while viewing same historical position ✅

**Conclusion: tempBoardState IS SET CORRECTLY**
The FEN state management properly captures the exact board position after move replay, with appropriate handling for all edge cases.

## currentFen Computed Property Verification

### Computed Property Logic:

**✅ Simple and Reliable Logic:**
```javascript
const currentFen = computed(() => {
  return tempBoardState.value || fen.value;
});
```

**✅ Fallback Behavior Analysis:**
- **When `tempBoardState.value` is NOT null**: Returns historical position FEN ✅
- **When `tempBoardState.value` IS null**: Returns actual game position FEN ✅
- **JavaScript Truthiness**: Uses logical OR operator for clean fallback ✅

**✅ State Scenarios Verification:**

| Scenario | tempBoardState.value | fen.value | currentFen Result | ✅ |
|----------|---------------------|-----------|-------------------|---|
| Viewing current position | null | "rnbqkbnr/pp...R" | "rnbqkbnr/pp...R" (actual game) | ✅ |
| Viewing initial position | "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" | "rnbqkbnr/pp...R" | "rnbqkbnr/pppppppp..." (initial) | ✅ |
| Viewing after move 1 | "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1" | "rnbqkbnr/pp...R" | "rnbqkbnr/pppppppp/8/8/4P3..." (after e4) | ✅ |
| Viewing after move 2 | "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2" | "rnbqkbnr/pp...R" | "rnbqkbnr/pppp1ppp..." (after e5) | ✅ |

**✅ Integration with Board Component:**
- **Direct Consumption**: `const { currentFen } = storeToRefs(gameStore)` ✅
- **Piece Management**: `usePieceManagement(currentFen)` receives correct FEN ✅
- **Reactive Updates**: Vue reactivity triggers re-renders when FEN changes ✅
- **Component Isolation**: Board doesn't need to know about temp vs actual state ✅

**✅ Data Source Integrity:**
- **fen.value**: Always reflects actual game state from `chessInstance.fen()` ✅
- **tempBoardState.value**: Set from validated move replay results ✅
- **Both Sources**: Guaranteed to be valid chess position FENs ✅
- **Consistency**: Same format and structure from both sources ✅

**✅ Reactivity Verification:**
- **Computed Property**: Automatically updates when either dependency changes ✅
- **Store Integration**: Uses `storeToRefs()` for proper reactivity in components ✅
- **Vue Reactivity**: Changes trigger board re-rendering automatically ✅

**Conclusion: currentFen RETURNS CORRECT VALUES**
The computed property correctly prioritizes historical positions when viewing past moves and falls back to the actual game position otherwise. Integration with the board component ensures proper display of the selected position.

## viewingMoveIndex State Tracking Verification

### State Definition and Initialization:

**✅ State Setup:**
```javascript
const viewingMoveIndex = ref(-1);  // Tracks which move position is being viewed
```

**✅ State Setting Logic:**
```javascript
// Current position (index -1):
viewingMoveIndex.value = -1;

// Initial position (index 0): 
viewingMoveIndex.value = 0;

// Historical positions (index ≥ 1):
viewingMoveIndex.value = index;
```

**✅ State Tracking Scenarios:**

| Action | Index Passed | viewingMoveIndex.value | Position Shown | ✅ |
|--------|-------------|----------------------|----------------|---|
| View current position | -1 | -1 | Current game state | ✅ |
| View initial position | 0 | 0 | Starting position | ✅ |
| Click White Move 1 | 1 | 1 | After first white move | ✅ |
| Click Black Move 1 | 2 | 2 | After first black move | ✅ |
| Click White Move 2 | 3 | 3 | After second white move | ✅ |
| Failed replay | any | unchanged | Previous position maintained | ✅ |

**✅ State Synchronization:**
- **Timing**: Set simultaneously with `tempBoardState` after successful replay ✅
- **Consistency**: Always matches the index that was used to generate current view ✅  
- **Error Handling**: Only updated on successful replay completion ✅
- **Initialization**: Starts at -1 (current position) by default ✅

**✅ State Exposure and Usage:**
- **Store Export**: Included in store's return object for component access ✅
- **Reactive Reference**: Available via `storeToRefs(gameStore)` ✅
- **Component Access**: Board component imports but doesn't actively use yet ✅
- **Future Extension**: Available for additional features (move highlighting, navigation) ✅

**✅ State Lifecycle Management:**
- **Current Position**: Set to -1 when returning to live game ✅
- **Historical Viewing**: Set to exact index being viewed ✅
- **State Persistence**: Maintains value while viewing same position ✅
- **Error Recovery**: Unchanged on failed operations ✅

**✅ Integration with Fixed Index Calculations:**
- **Correct Indices**: Now receives proper indices from fixed calculation functions ✅
- **White Moves**: Tracks indices 1, 3, 5, 7... correctly ✅
- **Black Moves**: Tracks indices 2, 4, 6, 8... correctly ✅
- **State Accuracy**: Always reflects the exact position being displayed ✅

**Conclusion: viewingMoveIndex TRACKS CORRECTLY**
The state accurately tracks which move position is being viewed, with proper synchronization to the displayed board state and reliable error handling.

## Success Validation Checklist

- [ ] Clicking White's 3rd move shows position after White's 3rd move (not before)
- [ ] Clicking Black's 2nd move shows position after Black's 2nd move (not before)
- [ ] Selected move is visually highlighted in Move History list
- [ ] Next/Previous buttons navigate correctly through historical positions
- [ ] "Go to last move" button returns to actual current game position
- [ ] Move-making is disabled when viewing historical positions
- [ ] "Viewing Past Moves" label appears when not at current position
- [ ] No console errors during move history navigation
- [ ] Both white and black moves behave consistently