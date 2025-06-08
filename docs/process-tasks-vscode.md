# Task List Management for Vue/Hono Development

Guidelines for managing task lists in markdown files to track progress on completing a PRD using VueJS, Tailwind CSS, Hono, and PostgreSQL.

## Tech Stack Implementation Guidelines

When implementing tasks, follow these patterns:

### Vue Components
- Use Composition API with `<script setup>` syntax
- Implement proper TypeScript interfaces
- Use Tailwind utility classes exclusively for styling
- Follow Vue 3 best practices for reactivity and lifecycle

### Hono API Development
- Follow RESTful conventions for endpoints
- Use proper HTTP status codes and error responses
- Implement request validation middleware
- Use parameterized queries for database operations

### Database Operations
- Create proper PostgreSQL migrations
- Use appropriate indexes for performance
- Implement proper foreign key relationships
- Handle database errors gracefully

## Task Implementation Protocol

- **One sub-task at a time:** Do **NOT** start the next sub-task until you ask the user for permission and they respond affirmatively
- **Completion protocol:**  
  1. When you finish a **sub-task**, immediately mark it as completed by changing `[ ]` to `[x]` in the task file
  2. If **all** subtasks underneath a parent task are now `[x]`, also mark the **parent task** as completed
  3. Update the task file directly using file operations
- **Wait for approval:** Stop after each sub-task and wait for the user's go-ahead before proceeding

## Task List Maintenance

1. **Update the task list file as you work:**
   - Mark tasks and subtasks as completed (`[x]`) per the protocol above
   - Add new tasks as they emerge during development
   - Keep the file synchronized with actual progress

2. **Maintain the "Relevant Files" section:**
   - List every file created or modified during implementation
   - Give each file a one-line description of its purpose
   - Organize by backend/frontend/database categories
   - Update as new files are created

3. **Track technical decisions:**
   - Note any deviations from original plan
   - Document any additional dependencies added
   - Record any architectural decisions made during implementation

## Implementation Standards

### Vue Component Structure
```vue
<template>
  <!-- Use Tailwind classes exclusively -->
  <div class="container mx-auto p-4">
    <!-- Component template -->
  </div>
</template>

<script setup lang="ts">
// Use Composition API with proper TypeScript
import { ref, computed, onMounted } from 'vue'
import type { ComponentProps } from '@/types/[feature]'

// Component logic
</script>
```

### Hono Route Structure
```typescript
// src/routes/[feature].ts
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { FeatureRequest, FeatureResponse } from '@/types/[feature]'

const app = new Hono()

app.get('/api/[resource]', async (c) => {
  // Proper error handling and response formatting
})

export default app
```

### Database Migration Pattern
```sql
-- migrations/[timestamp]_create_[table].sql
CREATE TABLE [table_name] (
    id SERIAL PRIMARY KEY,
    -- columns with appropriate types and constraints
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_[table]_[column] ON [table_name]([column]);
```

## Claude Code Instructions

When working with task lists, Claude Code must:

1. **File Management:**
   - Read the current task list file before starting work
   - Update the task list file after completing each sub-task
   - Create new files as specified in the "Relevant Files" section

2. **Progress Tracking:**
   - Mark each finished **sub-task** with `[x]` in the task file
   - Mark the **parent task** with `[x]` once **all** its subtasks are complete
   - Update the "Relevant Files" section with any new files created

3. **Implementation Flow:**
   - Check which sub-task is next in the sequence
   - Implement only that specific sub-task
   - Update the task file with completion status
   - Ask for user approval before proceeding to the next sub-task

4. **Quality Assurance:**
   - Follow the tech stack guidelines for each type of file
   - Ensure proper TypeScript interfaces are created
   - Verify Tailwind classes are used correctly
   - Test API endpoints return proper JSON responses

5. **Error Handling:**
   - If a sub-task cannot be completed, explain why and ask for guidance
   - If new sub-tasks are discovered, add them to the task list
   - If files need to be restructured, update the "Relevant Files" section

## Communication Protocol

After completing each sub-task:
1. Update the task file
2. Summarize what was accomplished
3. Show the updated task list status
4. Ask: "Ready to proceed to the next sub-task? (Please respond with 'yes' or 'y' to continue)"

## File Organization

Maintain this project structure:
```
/
├── tasks/
│   ├── prd-[feature].md
│   └── tasks-prd-[feature].md
├── src/
│   ├── components/[Feature]/
│   ├── views/
│   ├── composables/
│   ├── api/
│   ├── types/
│   └── routes/
└── database/
    ├── migrations/
    └── seeds/
```