# Feature Spec: AI Game Commentary & Subscription Tiers
**Project:** Log My Chess Games  
**Date:** March 2026  
**Status:** Ready for implementation

---

## Overview

This document covers two tightly coupled features:

1. **Subscription Tiers** — Freemium model with Stripe integration controlling how many games a user can log per month
2. **Claude Commentary** — AI-generated natural language game analysis (premium add-on), powered by Stockfish WASM + Claude API (Haiku 4.5)

These must be implemented together as the commentary feature is gated behind premium subscription tiers.

---

## Tech Stack (Existing)

- **Frontend:** Vue 3 + Vite + Pinia + Tailwind CSS
- **Backend:** Hono + PostgreSQL + Prisma ORM
- **Auth:** JWT + Google OAuth
- **Chess Logic:** chess.js (v1.2.0)
- **Engine:** Stockfish WASM (already integrated for eval bar)
- **Routing:** Vue Router (routes: `/game-input`, `/game-history`, `/settings`, `/auth`)
- **Payment:** Stripe (to be integrated)
- **AI:** Anthropic Claude API (claude-haiku-4-5-20251001)

---

## Part 1: Subscription Tiers

### Tier Definitions

| Tier | Price | Games/Month | Commentary |
|---|---|---|---|
| Pawn | Free | 5 | ⚠️ 3 lifetime trial analyses |
| Knight | TBD | 20 | ⚠️ 3 lifetime trial analyses |
| Knight Premium | TBD | 20 | ✅ Unlimited |
| Rook | TBD | 50 | ⚠️ 3 lifetime trial analyses |
| Rook Premium | TBD | 50 | ✅ Unlimited |
| Queen | TBD | Unlimited | ⚠️ 3 lifetime trial analyses |
| Queen Premium | TBD | Unlimited | ✅ Unlimited |

> **Note:** Pricing for paid tiers to be finalised once hosting/database/API costs are confirmed. Commentary add-on is a Stripe subscription add-on on top of the base tier price.

### Commentary Trial (all non-Premium tiers)
- **All** non-Premium tiers (Pawn, Knight, Rook, Queen) get **3 lifetime commentary analyses** (not per month — total, ever)
- After 3 uses, the Analyse button is replaced with an upgrade prompt encouraging the user to add the Premium commentary add-on to their current tier
- Trial count stored on the user record
- If a user upgrades from e.g. Knight to Knight Premium, their trial count is irrelevant — they have unlimited analyses

### Business Rules
- Game input is blocked (with upgrade prompt) when monthly game count >= tier limit
- Monthly game count resets on the user's billing anniversary date (or 1st of month for free tier)
- Commentary is only available on tiers with the Premium add-on, plus Pawn trial
- Downgrading a subscription retains existing game data but restricts new input immediately

---

## Part 2: Database Schema Changes

### User model additions
```prisma
model User {
  // ... existing fields ...
  subscriptionTier      SubscriptionTier  @default(PAWN)
  hasCommentaryAddon    Boolean           @default(false)
  stripeCustomerId      String?
  stripeSubscriptionId  String?
  monthlyGamesCount     Int               @default(0)
  monthlyGamesResetAt   DateTime          @default(now())
  commentaryTrialUsed   Int               @default(0)  // Pawn trial counter (max 3)
}

enum SubscriptionTier {
  PAWN
  KNIGHT
  ROOK
  QUEEN
}
```

### Game model additions
```prisma
model Game {
  // ... existing fields ...
  analysisStatus      AnalysisStatus    @default(NONE)
  analysisData        Json?             // Stores per-move Stockfish + Claude commentary
  analysedAt          DateTime?
}

enum AnalysisStatus {
  NONE        // Not yet analysed
  PENDING     // Analysis triggered, in progress (for future async use)
  COMPLETE    // Analysis stored and ready
}
```

### Analysis data structure (stored in `analysisData` JSON column)
```json
{
  "moves": [
    {
      "moveNumber": 1,
      "color": "white",
      "san": "e4",
      "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR b KQkq e3 0 1",
      "evaluation": 0.3,
      "bestMove": "e4",
      "centipawnLoss": 0,
      "classification": "best",
      "commentary": "A confident start, staking a claim in the centre..."
    }
  ],
  "summary": "Overall summary of the game narrative...",
  "generatedAt": "2026-03-29T12:00:00Z"
}
```

### Move classification thresholds (based on centipawn loss)
| Classification | Centipawn Loss |
|---|---|
| Best | 0–10 |
| Excellent | 11–25 |
| Good | 26–50 |
| Inaccuracy | 51–100 |
| Mistake | 101–200 |
| Blunder | 200+ |

---

## Part 3: Commentary Feature — User Flow

### Trigger points
1. **Game Input screen** — After a game is saved, an "Analyse Game" button appears below the board controls
2. **Game History screen** — Each game card/row has an "Analyse Game" button (or "View Analysis" if already analysed)

### Analysis Flow (step by step)
1. User clicks "Analyse Game"
2. If on Game History screen → navigate to Game Input/Review screen for that game, then begin analysis
3. A **progress modal or overlay** appears with a progress bar showing two phases:
   - Phase 1: "Running engine analysis..." (Stockfish processing all positions)
   - Phase 2: "Generating commentary..." (Claude API call)
4. Stockfish WASM steps through every position in the game sequentially, collecting at each position:
   - Centipawn evaluation score
   - Best move (engine recommendation)
   - Analysis depth = user's currently configured depth from Settings slider
5. Once all positions are evaluated, a **single API call** is made to the Hono backend with the full move + evaluation dataset
6. Backend calls Claude API (Haiku 4.5) with structured prompt
7. Claude returns commentary for every move plus a game summary
8. Response is stored in the `analysisData` JSON column on the Game record, `analysisStatus` set to `COMPLETE`
9. Progress modal closes, commentary panel renders
10. "Analyse Game" button changes to "View Analysis" everywhere this game appears

### Error handling
- If Stockfish phase fails: show error, allow retry
- If Claude API call fails: show error, allow retry (Stockfish data does not need to be re-run)
- If user closes/navigates away during analysis: analysis is abandoned (no partial saves)

---

## Part 4: Claude API Integration

### Model
`claude-haiku-4-5-20251001` — sufficient for chess commentary, cost-effective

### Backend endpoint
```
POST /api/games/:id/analyse
```
- Protected: requires auth + premium commentary entitlement check
- Accepts: full move array with Stockfish evaluation data
- Returns: commentary per move + game summary

### Prompt structure (sent as single request)
```
System prompt (cacheable):
You are an expert chess commentator providing instructive, engaging commentary 
for club-level players. For each move provide 1-3 sentences that:
- Explain the strategic or tactical idea behind the move
- Note if it was the best move, an inaccuracy, mistake, or blunder
- Reference how it affects the position (pawn structure, king safety, piece activity)
- Occasionally reference earlier moves for narrative continuity
Use friendly, encouraging language. Be specific about chess concepts but 
accessible to improvers. Never be dismissive of mistakes — frame them as 
learning opportunities.

User prompt:
Here is a chess game to commentate. For each move return a JSON array.
Return ONLY valid JSON, no markdown, no preamble.

Game details:
- Opening: [opening name]
- Result: [result]
- Player colours: [user played White/Black]

Moves:
[array of move objects with san, fen, evaluation, bestMove, centipawnLoss, classification]

Return format:
{
  "moves": [
    { "moveIndex": 0, "commentary": "..." }
  ],
  "summary": "2-3 sentence overall game narrative"
}
```

### Prompt caching
- The system prompt should use Anthropic's prompt caching (cache_control: ephemeral) to reduce costs on repeated calls

### Cost estimate
- ~$0.01–0.02 per game analysis with Haiku 4.5 + prompt caching

### Batch API (future consideration)
- Anthropic's Batch API offers a 50% discount on all token costs by processing requests asynchronously (results within minutes to 24 hours)
- **Not used for MVP** — instant analysis is a stronger user experience; the user triggers analysis and expects results within seconds, which is incompatible with batch processing latency
- **Future use cases to consider:**
  - Bulk re-analysis of all existing games if the commentary prompt is updated or improved
  - An optional "Analyse Later" mode where users accept a delay in exchange for reduced cost
  - Background nightly analysis jobs if a scheduled analysis feature is ever added

---

## Part 5: UI Changes

### Commentary Panel

#### Desktop layout (existing: eval bar left | board centre | move history right)
```
[ Eval Bar ] [ Board              ] [ Move History Panel    ]
                                    [ ──────────────────── ]
                                    [ Commentary Panel      ]
                                    [ (scrollable)          ]
```

#### Mobile layout (existing: eval bar above board, move history below)
```
[ Commentary Panel (scrollable, collapsible) ]
[ Eval Bar (horizontal)                      ]
[ Board                                      ]
[ Move History                               ]
```

### Commentary Panel behaviour
- Mirrors chess.com's presentation style: scrollable transcript of all moves with commentary
- Current move is **highlighted** in the panel as user steps through moves with navigation controls
- Panel auto-scrolls to keep current move commentary in view
- Each move entry shows: move notation + classification badge (Best/Excellent/Good/Inaccuracy/Mistake/Blunder) + commentary text
- A "Game Summary" section appears at the top of the panel
- On mobile, panel is **collapsible** (toggle button) to free up screen space for the board

### Classification badge colours
| Classification | Colour |
|---|---|
| Best | Green |
| Excellent | Teal |
| Good | Blue |
| Inaccuracy | Yellow |
| Mistake | Orange |
| Blunder | Red |

### Analyse Game button states
| State | Button Text | Behaviour |
|---|---|---|
| Not analysed, entitled | "Analyse Game" | Triggers analysis flow |
| Already analysed | "View Analysis" | Opens/scrolls to commentary panel |
| Trial exhausted (any non-Premium tier) | "Add Commentary" | Opens upgrade modal prompting Premium add-on for current tier |

---

## Part 6: New Backend Endpoints

### Subscription
```
GET  /api/subscription/status          — Returns user's current tier, addon, game counts
POST /api/subscription/create-checkout — Creates Stripe checkout session
POST /api/subscription/webhook         — Stripe webhook handler (tier changes, cancellations)
POST /api/subscription/portal          — Creates Stripe customer portal session
```

### Analysis
```
POST /api/games/:id/analyse            — Triggers Claude commentary (accepts Stockfish data)
GET  /api/games/:id/analysis           — Returns stored analysis for a game
```

### User/game limits
```
GET  /api/user/game-limit              — Returns current month count + tier limit
```

---

## Part 7: Stripe Integration

### Products to create in Stripe
- Knight (monthly subscription)
- Knight Premium (monthly subscription, includes commentary)
- Rook (monthly subscription)
- Rook Premium (monthly subscription, includes commentary)
- Queen (monthly subscription)
- Queen Premium (monthly subscription, includes commentary)

> Commentary can be modelled either as separate products or as Stripe's native add-on/subscription item feature. Recommend separate products for simplicity initially.

### Webhook events to handle
- `checkout.session.completed` → activate subscription, update user tier
- `customer.subscription.updated` → handle upgrades/downgrades
- `customer.subscription.deleted` → downgrade to Pawn
- `invoice.payment_failed` → notify user, grace period TBD

---

## Part 8: Settings Page Additions

- New **Subscription** section showing current tier, next billing date, usage (X of Y games this month)
- Upgrade/manage subscription button (links to Stripe customer portal)
- Existing analysis depth slider already present — no changes needed

---

## Part 9: Implementation Order (Suggested)

1. **Database migrations** — add subscription fields + analysis fields to schema
2. **Subscription tier enforcement** — middleware to check game limits on game save
3. **Stripe integration** — products, checkout, webhooks, customer portal
4. **Settings page** — subscription status display
5. **Stockfish evaluation collection** — extend existing Stockfish integration to capture centipawn + best move per position
6. **Backend analysis endpoint** — Claude API call + response storage
7. **Commentary panel UI** — desktop + mobile layouts
8. **Analyse/View Analysis buttons** — game input screen + game history screen
9. **Progress modal** — two-phase progress indicator
10. **Pawn trial tracking** — 3-use lifetime counter + upgrade prompts

---

## Open Questions (to resolve before/during implementation)

- [ ] Final pricing for Knight, Rook, Queen and Premium add-on tiers (pending hosting cost review)
- [ ] Monthly game limits for Knight (20) and Rook (50) — confirm these feel right
- [ ] Grace period policy for failed Stripe payments
- [ ] Whether to support annual billing discount from launch or add later
- [ ] Mobile commentary panel: default open or collapsed when analysis exists?
