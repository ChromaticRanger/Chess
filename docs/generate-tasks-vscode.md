# Rule: Generating a Task List from a PRD

## Goal

To guide Claude Code in creating a detailed, step-by-step task list in Markdown format based on an existing Product Requirements Document (PRD). The task list should guide a developer through implementation using VueJS, Tailwind CSS, Hono, and PostgreSQL.

## Tech Stack Context

All task lists should be structured around this technology stack:
- **Frontend:** VueJS 3 with Composition API, Tailwind CSS
- **Backend:** Hono framework for RESTful APIs
- **Database:** PostgreSQL with proper schema design
- **Development:** Vue Single File Components (.vue), TypeScript support

## Process

1. **Receive PRD Reference:** The user points Claude Code to a specific PRD file in the tasks directory
2. **Analyze PRD:** Read and analyze the functional requirements, technical architecture, and user stories from the specified PRD
3. **Phase 1: Generate Parent Tasks:** Create high-level tasks (typically 5-7) covering the full implementation. Present these to the user and inform: "I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks? Respond with 'Go' to proceed."
4. **Wait for Confirmation:** Pause and wait for the user to respond with "Go"
5. **Phase 2: Generate Sub-Tasks:** Break down each parent task into smaller, actionable sub-tasks with specific technical details
6. **Identify Relevant Files:** List all files that will need to be created or modified
7. **Save Task List:** Create and save the task list file in the tasks directory

## Task Categories (Typical Structure)

Parent tasks should generally follow this pattern:

1. **Database Setup** - PostgreSQL schema, migrations, seed data
2. **Backend API Development** - Hono routes, middleware, validation
3. **Frontend Components** - Vue components with Tailwind styling
4. **API Integration** - Connect Vue frontend to Hono backend APIs
5. **Testing & Validation** - Unit tests, integration tests, manual testing
6. **Documentation & Deployment** - README updates, deployment considerations

## Output Format

```markdown
## Relevant Files

### Backend (Hono)
- `src/routes/[feature].ts` - Hono API routes for [feature]
- `src/routes/[feature].test.ts` - API route tests
- `src/middleware/[feature].ts` - Custom middleware if needed
- `src/types/[feature].ts` - TypeScript interfaces for [feature]
- `src/db/migrations/[timestamp]_create_[table].sql` - Database migration
- `src/db/seeds/[feature].ts` - Seed data for development

### Frontend (Vue)
- `src/components/[Feature]/[ComponentName].vue` - Main feature components
- `src/components/[Feature]/[ComponentName].test.ts` - Component tests
- `src/views/[Feature]View.vue` - Page-level components
- `src/composables/use[Feature].ts` - Vue composables for state/logic
- `src/composables/use[Feature].test.ts` - Composable tests
- `src/types/[feature].ts` - Frontend TypeScript interfaces
- `src/api/[feature].ts` - API client functions

### Database
- `database/migrations/[timestamp]_create_[tables].sql` - Schema migrations
- `database/seeds/[feature].sql` - Sample data

### Notes
- Vue components should use Composition API with `<script setup>` syntax
- Use Tailwind utility classes for all styling
- API calls should use proper error handling and loading states
- All database operations should use parameterized queries
- Follow RESTful conventions for API endpoints

## Tasks

- [ ] 1.0 Database Schema & Migrations
  - [ ] 1.1 Design PostgreSQL schema for [tables]
  - [ ] 1.2 Create migration files for table creation
  - [ ] 1.3 Add necessary indexes for performance
  - [ ] 1.4 Create seed data for development/testing

- [ ] 2.0 Backend API Development (Hono)
  - [ ] 2.1 Set up Hono routes for [endpoints]
  - [ ] 2.2 Implement request validation middleware
  - [ ] 2.3 Create database query functions
  - [ ] 2.4 Add error handling and status codes
  - [ ] 2.5 Write API integration tests

- [ ] 3.0 Frontend Vue Components
  - [ ] 3.1 Create main [Feature] component with Tailwind styling
  - [ ] 3.2 Build sub-components for [specific UI elements]
  - [ ] 3.3 Implement form validation and user feedback
  - [ ] 3.4 Add responsive design with Tailwind breakpoints
  - [ ] 3.5 Create Vue composables for reusable logic

- [ ] 4.0 API Integration & State Management
  - [ ] 4.1 Create API client functions for all endpoints
  - [ ] 4.2 Implement loading states and error handling
  - [ ] 4.3 Add optimistic updates where appropriate
  - [ ] 4.4 Test API integration with real backend

- [ ] 5.0 Testing & Quality Assurance
  - [ ] 5.1 Write unit tests for Vue components
  - [ ] 5.2 Write unit tests for composables
  - [ ] 5.3 Test API endpoints with various data scenarios
  - [ ] 5.4 Perform manual testing across different devices
  - [ ] 5.5 Validate accessibility with screen readers

- [ ] 6.0 Documentation & Finalization
  - [ ] 6.1 Update API documentation
  - [ ] 6.2 Document Vue component props and events
  - [ ] 6.3 Update project README with new feature info
  - [ ] 6.4 Prepare deployment scripts if needed
```

## File Creation Instructions

Claude Code should:
1. Create the `tasks/tasks-[prd-filename].md` file directly
2. Use the exact filename format: if PRD is `prd-user-dashboard.md`, create `tasks-prd-user-dashboard.md`
3. Ensure the tasks directory exists before creating the file

## Interaction Model

The process requires a pause after generating parent tasks to get user confirmation ("Go") before proceeding to generate detailed sub-tasks. This ensures the high-level plan aligns with expectations.

## Target Audience

Assume the reader is familiar with Vue 3, Tailwind CSS, Hono, and PostgreSQL development patterns.