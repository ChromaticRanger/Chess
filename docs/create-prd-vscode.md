# Rule: Generating a Product Requirements Document (PRD)

## Goal

To guide Claude Code in creating a detailed Product Requirements Document (PRD) in Markdown format, based on an initial user prompt. The PRD should be clear, actionable, and suitable for a developer to understand and implement the feature using VueJS, Tailwind CSS, Hono, and PostgreSQL.

## Process

1. **Receive Initial Prompt:** The user provides a brief description or request for a new feature or functionality.
2. **Ask Clarifying Questions:** Before writing the PRD, Claude Code *must* ask clarifying questions to gather sufficient detail. The goal is to understand the "what" and "why" of the feature, not necessarily the "how" (which the developer will figure out).
3. **Generate PRD:** Based on the initial prompt and the user's answers to the clarifying questions, generate a PRD using the structure outlined below.
4. **Create Feature Directory:** Create a subdirectory within tasks for the feature: `tasks/[feature-name]/`
5. **Save PRD:** Save the generated document as `tasks/[feature-name]/prd-[feature-name].md`.

## Tech Stack Context

All PRDs should consider this technology stack:
- **Frontend:** VueJS 3 with Composition API, Tailwind CSS for styling
- **Backend:** Hono framework for API development
- **Database:** PostgreSQL with appropriate ORM/query builder
- **Architecture:** RESTful APIs connecting Vue frontend to Hono backend

## Clarifying Questions (Examples)

Claude Code should adapt questions based on the prompt, but here are common areas to explore:

- **Problem/Goal:** "What problem does this feature solve for the user?" or "What is the main goal we want to achieve with this feature?"
- **Target User:** "Who is the primary user of this feature?"
- **Core Functionality:** "Can you describe the key actions a user should be able to perform with this feature?"
- **User Stories:** "Could you provide a few user stories? (e.g., As a [type of user], I want to [perform an action] so that [benefit].)"
- **Data Requirements:** "What kind of data does this feature need to display or manipulate? What database tables might be involved?"
- **API Endpoints:** "What API endpoints will this feature likely need? (GET, POST, PUT, DELETE operations)"
- **UI Components:** "Can you describe the Vue components needed? Any specific Tailwind styling requirements?"
- **Acceptance Criteria:** "How will we know when this feature is successfully implemented? What are the key success criteria?"
- **Scope/Boundaries:** "Are there any specific things this feature *should not* do (non-goals)?"
- **Authentication:** "Does this feature require user authentication or specific permissions?"
- **Real-time Updates:** "Does this feature need real-time updates or is standard HTTP sufficient?"

## PRD Structure

The generated PRD should include the following sections:

1. **Introduction/Overview:** Briefly describe the feature and the problem it solves. State the goal.

2. **Goals:** List the specific, measurable objectives for this feature.

3. **User Stories:** Detail the user narratives describing feature usage and benefits.

4. **Functional Requirements:** List the specific functionalities the feature must have. Use clear, concise language. Number these requirements.

5. **Technical Architecture:**
   - **Frontend Components:** List Vue components needed
   - **API Endpoints:** Required Hono routes and their purposes
   - **Database Schema:** PostgreSQL tables and relationships needed
   - **Authentication:** Any auth requirements

6. **UI/UX Requirements:**
   - **Vue Components:** Describe key components and their functionality
   - **Tailwind Styling:** Mention any specific design patterns or utility classes
   - **Responsive Design:** Mobile/desktop considerations

7. **API Specifications:**
   - **Endpoints:** List all Hono API endpoints with methods and purposes
   - **Request/Response:** Key data structures
   - **Error Handling:** Expected error responses

8. **Database Requirements:**
   - **Tables:** PostgreSQL tables needed
   - **Relationships:** Foreign keys and associations
   - **Indexes:** Performance considerations

9. **Non-Goals (Out of Scope):** Clearly state what this feature will *not* include to manage scope.

10. **Success Metrics:** How will the success of this feature be measured?

11. **Open Questions:** List any remaining questions or areas needing further clarification.

## Target Audience

Assume the primary reader is a developer familiar with the Vue/Hono/PostgreSQL stack. Requirements should be explicit and technically detailed enough for implementation.

## Output Instructions

- **Format:** Markdown (`.md`)
- **Location:** `tasks/[feature-name]/`
- **Filename:** `prd-[feature-name].md`
- **Directory Creation:** Claude Code should create the feature subdirectory if it doesn't exist (`tasks/[feature-name]/`)
- **File Creation:** Save the PRD file directly in the feature-specific subdirectory

## Final Instructions

1. Do NOT start implementing the PRD
2. Make sure to ask the user clarifying questions
3. Take the user's answers to the clarifying questions and improve the PRD
4. Create the feature subdirectory within tasks and save the PRD file when complete