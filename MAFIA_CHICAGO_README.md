# Мафия: Чикаго (Mafia: Chicago) - Telegram WebApp Game

This document provides instructions for setting up, running, and testing the "Mafia: Chicago" game implemented within the Telegram WebApp platform.

## Overview

"Mafia: Chicago" is a multiplayer social deduction game set in the criminal underworld of 1930s Chicago. The game supports 8 players with different roles (Mafia, Doctor, Sheriff, and Civilians) and follows a cycle of phases: Night, Morning, Discussion, Voting, and Death.

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Docker (optional, for running PostgreSQL)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/philip211/platform-webapp.git
cd platform-webapp
```

2. Install dependencies for all components:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../platform-webapp
npm install

# Install bot dependencies
cd ../telegram-bot
npm install
```

3. Set up the database:
```bash
# Run PostgreSQL in Docker
docker run --name telegram-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Create .env file for backend
cd ../backend
echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/telegram_platform"' > .env

# Apply Prisma migrations
npx prisma db push
```

4. Configure the Telegram bot:
```bash
# Create .env file for the bot
cd ../telegram-bot
echo 'BOT_TOKEN=your_bot_token_here' > .env
echo 'WEBAPP_URL=https://mafia-chicago-app.loca.lt' >> .env
```

## Running the Application

1. Start the backend:
```bash
cd backend
npm run start:dev
```

2. Start the frontend:
```bash
cd ../platform-webapp
npm run dev
```

3. Start the Telegram bot:
```bash
cd ../telegram-bot
npm run dev
```

4. Create a localtunnel for external access:
```bash
# Use the provided script
./restart_tunnel.sh

# Or run manually
npx localtunnel --port 5173 --subdomain mafia-chicago-app
```

## Testing the Game

### Automated Testing

We've included test scripts to help you test the game functionality:

1. Test player joining and invitation system:
```bash
cd test
node test_invitation.js
```

2. Test full game with 8 players:
```bash
node test_game.js
```

### Manual Testing via Telegram

1. Open your Telegram bot
2. Send the `/start` command
3. Click on the "Mafia: Chicago" button to launch the game
4. Share the game with friends using the invitation link generated in the waiting room

## Game Rules

### Roles
- **Mafia (1-2 players)**: Can kill a player in their location
- **Doctor (1 player)**: Can heal a player in their location
- **Sheriff (1 player)**: Can investigate a player in their location
- **Civilians (4-5 players)**: Must identify and eliminate the Mafia

### Game Flow
1. **Night Phase**: Players select locations and perform role actions
2. **Morning Phase**: Results of night actions are revealed
3. **Discussion Phase**: Players discuss and exchange gifts
4. **Voting Phase**: Players vote on who to eliminate
5. **Death Phase**: The player with the most votes is eliminated

### Win Conditions
- **Civilians win**: If all Mafia members are eliminated
- **Mafia wins**: If only 1 Mafia and 1 Civilian remain

## Troubleshooting

### 503 Service Unavailable
If you encounter a 503 error:
1. Check that all services (backend, frontend, bot) are running
2. Restart the localtunnel using `./restart_tunnel.sh`
3. Update the `WEBAPP_URL` in the bot's `.env` file if the tunnel URL changes

### Players Not Seeing Each Other
If players join but don't see each other in the waiting room:
1. Make sure all players are using the same invitation link
2. Check the backend logs for any errors
3. Verify that the database connection is working properly

## Development Notes

- The game is integrated into the existing platform architecture
- Frontend uses React, Vite, Zustand, and SCSS
- Backend uses NestJS and Prisma
- All game logic is implemented in the backend
- The frontend communicates with the backend via REST API
- The game is accessible only through the Telegram WebApp

## Contributing

Please follow the existing code structure and patterns when making changes. Do not modify the core platform architecture.
