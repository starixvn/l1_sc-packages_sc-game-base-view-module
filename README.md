<!-- @format -->

# sc-game-base-view-module

A reusable view module for sc-game-base applications that provides common view-related functionality for handling view-only clients in gaming applications.

## Installation

```bash
npm install sc-game-base-view-module
```

## Requirements

- Node.js >= 14.x
- sc-game-base >= 4.0.0
- socket.io >= 4.0.0

## Components

### BaseViewRouter

The `BaseViewRouter` class manages socket connections and routing for view-only clients. It handles:

- Socket connection initialization
- View-only client management
- In-game event handling
- Disconnection handling

Key features:

- Maintains a registry of view-only players
- Integrates with various game consumers (sign-in, in-game, bet placement)
- Handles permission validation
- Provides error logging

### GameStatusPublisher

Extends the base `GameStatusPublisher` from sc-game-base to include view-only clients in game status updates. Features:

- Broadcasts game status to all connected view clients
- Handles enabling/disabling game status updates
- Manages game configuration distribution
- Supports special game modes (e.g., free bets)

### RoundResultPublisher

Extends the base `RoundResultPublisher` from sc-game-base to include view-only clients in round result updates. Features:

- Publishes round results to all connected view clients
- Handles asynchronous result distribution
- Includes error handling for socket emissions

### ViewConsumer

The `ViewConsumer` class handles view-only client requests and builds appropriate payloads. Features:

- Manages game state information
- Handles disabled game states
- Provides round history
- Manages game configurations
- Tracks betting information

## Usage

```typescript
import {
  BaseViewRouter,
  GameStatusPublisher,
  RoundResultPublisher,
  ViewConsumer,
} from "sc-game-base-view-module";

// Initialize ViewConsumer
const viewConsumer = new ViewConsumer(
  definition,
  gameData,
  roundQuery,
  publisher,
  getBalance,
  userInfosRepository
);

// Initialize BaseViewRouter
const viewRouter = new BaseViewRouter({
  definition,
  gameData,
  userSignInConsumer,
  inGameConsumer,
  placeBetConsumer,
  userDisconnectConsumer,
  userSignInPublisher,
  historyQuery,
  logService,
  playGamePermissionValidator,
  viewConsumer,
});

// Initialize publishers
const gameStatusPublisher = new GameStatusPublisher({
  gameData,
  gameName: "yourGameName",
});

const roundResultPublisher = new RoundResultPublisher({
  gameData,
  definition,
});

// Use with socket.io
io.on("connection", (socket) => {
  viewRouter.init(socket);
});
```

## Development

```bash
# Install dependencies
npm run setup

# Build the project
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run mutation tests
npm run test:mutation
```

## Contributing

Please ensure all new features include appropriate test coverage and documentation.

## License

ISC
