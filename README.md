# Chess App with User Profiles and Position Saving

This project is an intelligent chess board application with user authentication and game position saving functionality.

## Features

- Interactive chess board with full game rules
- Move validation and check/checkmate detection
- User authentication (signup/login)
- Save and load board positions
- Game history tracking

## Setup and Installation

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend

```bash
# Navigate to backend directory
cd backend

# Setup database and dependencies (first time only)
npm run setup

# Start development server
npm run dev
```

## Database Setup

1. Make sure PostgreSQL is installed and running
2. Create a database named `chess_app`
3. Configure `.env` file in the backend directory with your database credentials:

```
DATABASE_URL="postgresql://username:password@localhost:5432/chess_app"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

## Technology Stack

- **Frontend**: Vue.js 3 with Composition API, TailwindCSS
- **Backend**: Hono.js, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt for password hashing

## Future Ideas

- A chess engine to play against
  - Maybe as a separate project with a plugin architecture for different engines
- Advanced position analysis tools
- Game sharing functionality
- Integration with other chess platforms
