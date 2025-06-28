# PRD: Fix Move History List Position Synchronization

## Introduction/Overview

The Move History list in the chess application currently has a synchronization issue where clicking on a move displays the board position before that move was played, rather than the position after the move. This creates confusion for users who expect to see the result of clicking on a specific move. The goal is to fix this off-by-one error so that clicking on any move in the history shows the correct board position after that move was executed.

## Goals

1. Fix the position synchronization so that clicking on a move shows the board position **after** that move was played
2. Ensure proper visual feedback by highlighting the selected move in the Move History list
3. Maintain existing functionality for move navigation (next/previous buttons, "Go to last move")
4. Preserve the "Viewing Past Moves" label functionality that already works
5. Ensure move-making is properly disabled when viewing historical positions

## User Stories

- **As a chess player**, I want to click on White's 3rd move in the history and see the board position after White's 3rd move was played, so that I can review the game accurately
- **As a chess player**, I want to click on any move in the history and see the resulting position, so that I can understand the progression of the game
- **As a chess player**, I want the selected move to be visually highlighted in the Move History list, so that I know which position I'm currently viewing
- **As a chess player**, I want to navigate through moves sequentially or jump to specific positions, so that I can analyze the game effectively
- **As a chess player**, I want to easily return to the current game position to continue playing, so that reviewing history doesn't interfere with ongoing gameplay

## Functional Requirements

1. **Correct Position Display**: When a user clicks on a move in the Move History list, the board must display the position after that move was executed
2. **Visual Highlighting**: The clicked move must be visually highlighted in the Move History list to indicate it's the currently viewed position
3. **Index Synchronization**: The move index calculation must correctly map clicked moves to their corresponding board positions
4. **Navigation Preservation**: Existing next/previous button functionality must continue to work correctly
5. **Current Position Return**: The "Go to last move" button must correctly return to the actual current game position
6. **Move Disable**: Move-making must be disabled when viewing any historical position
7. **Consistent Behavior**: Both white and black moves must behave consistently when clicked

## Technical Architecture

### Frontend Components
- **MoveHistoryList.vue**: Fix index calculation in `getWhiteMoveIndex` and `getBlackMoveIndex` functions
- **Board.vue**: Ensure proper consumption of `currentFen` from game store
- **MoveControlPanel.vue**: Verify navigation buttons work with corrected indices
- **BoardStatusPanel.vue**: Maintain "Viewing Past Moves" label functionality

### API Endpoints
- No new API endpoints required (frontend-only fix)

### Database Schema
- No database changes required

### Authentication
- No authentication changes required

## UI/UX Requirements

### Vue Components
- **MoveHistoryList**: Update move selection logic to pass correct indices
- **Board**: Continue using `currentFen` computed property from store
- **Visual Feedback**: Maintain existing highlighting using `currentMoveIndex` prop

### Tailwind Styling
- Preserve existing styling for move highlighting (`bg-blue-100` class)
- Maintain hover effects (`hover:bg-blue-50`)
- Keep current responsive design patterns

### Responsive Design
- No changes to responsive behavior required

## API Specifications

### Endpoints
- No API changes required

### Request/Response
- No new data structures needed

### Error Handling
- Maintain existing error handling for invalid move indices

## Database Requirements

### Tables
- No database changes required

### Relationships
- No new relationships needed

### Indexes
- No index changes required

## Technical Implementation Details

### Root Cause Analysis
The issue appears to be in the index calculation or handling within:
1. `getWhiteMoveIndex(moveNumber)` and `getBlackMoveIndex(moveNumber)` functions in MoveHistoryList.vue
2. The `selectMove(moveIndex)` function and how it calls `viewMoveAtIndex`
3. The `viewMoveAtIndex(index)` function in the game store

### Expected Fix Areas
1. **Index Calculation**: Verify that move indices correctly map to post-move positions
2. **Store Function**: Ensure `viewMoveAtIndex` properly replays moves to show the position after the specified move
3. **Event Handling**: Confirm that click handlers pass the correct index values

### Current Implementation Review
- `getWhiteMoveIndex`: Returns `(moveNumber-1)*2` 
- `getBlackMoveIndex`: Returns `(moveNumber-1)*2 + 1`
- `viewMoveAtIndex`: Replays moves up to index, but may need adjustment for post-move positions

## Non-Goals (Out of Scope)

1. **Branching**: Creating alternate game lines from historical positions
2. **Keyboard Shortcuts**: Adding keyboard navigation for move history
3. **Animation**: Adding transitions between historical positions
4. **Move Annotations**: Adding move quality indicators or comments
5. **Export**: Exporting specific positions or move ranges
6. **Advanced Navigation**: Features like "go to move N" input field

## Success Metrics

1. **Functional Correctness**: Clicking on any move shows the board position after that move (100% accuracy)
2. **Visual Feedback**: Selected move is properly highlighted in the history list
3. **Navigation Consistency**: Next/previous buttons work correctly with fixed indices
4. **User Experience**: No confusion about which position is being displayed
5. **Regression Prevention**: All existing move history features continue to work

## Open Questions

1. **Edge Case Handling**: How should the system handle clicking on the very first move vs. the initial position?
2. **Performance**: Are there any performance considerations when rapidly clicking through moves?
3. **State Management**: Should the highlighting state be preserved when returning to current position?

## Acceptance Criteria

### Primary Criteria
- [ ] Clicking on White's 3rd move shows the position after White's 3rd move
- [ ] Clicking on Black's 2nd move shows the position after Black's 2nd move
- [ ] Selected move is visually highlighted in the Move History list
- [ ] Next/Previous buttons navigate correctly through historical positions
- [ ] "Go to last move" button returns to actual current game position

### Secondary Criteria
- [ ] Move-making is disabled when viewing historical positions
- [ ] "Viewing Past Moves" label appears when not at current position
- [ ] Rapid clicking between moves works smoothly
- [ ] Both white and black moves behave consistently

### Technical Criteria
- [ ] No console errors when navigating move history
- [ ] Proper index calculations for all move positions
- [ ] Correct FEN state management in game store
- [ ] Maintained compatibility with existing move control features