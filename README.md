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
- In-game event handling and routing
- Disconnection handling
- Error logging and validation

Configuration options:

```typescript
interface BaseViewRouterConfig {
  definition: any;
  gameData: GameData;
  userSignInConsumer: UserSignInConsumer;
  inGameConsumer: InGameConsumer;
  placeBetConsumer: PlaceBetConsumer;
  userDisconnectConsumer: UserDisconnectConsumer;
  userSignInPublisher: UserSignInPublisher;
  historyQuery: HistoryQuery;
  logService: LogService;
  playGamePermissionValidator: PlayGamePermissionValidator;
  viewConsumer: ViewConsumer;
}
```

### ViewConsumer

The `ViewConsumer` class handles view-only client requests and builds appropriate payloads. Features:

- Manages game state information
- Handles game configurations (odds, free bets, boosted choices)
- Provides round history with configurable history length
- Tracks betting information and remaining time
- Supports user-specific data handling

Constructor parameters:

```typescript
constructor(
    definition: Definition,
    gameData: GameData,
    roundQuery: RoundQuery,
    publisher: Publisher,
    getBalance: GetBalance,
    userInfosRepository: UserInfosRepository
)
```

### GameStatusPublisher

Extends the base `GameStatusPublisher` from sc-game-base to include view-only clients in game status updates. Features:

- Broadcasts game status to all connected view clients
- Handles enabling/disabling game status updates
- Manages game configuration distribution
- Supports special game modes (e.g., free bets)
- Integrates with sc-game-base core functionality

### RoundResultPublisher

Extends the base `RoundResultPublisher` from sc-game-base to include view-only clients in round result updates. Features:

- Publishes round results to all connected view clients
- Handles asynchronous result distribution
- Includes error handling for socket emissions
- Supports custom game definitions
- Maintains backward compatibility with sc-game-base

## Usage

```typescript
import {
  BaseViewRouter,
  GameStatusPublisher,
  RoundResultPublisher,
  ViewConsumer,
} from "sc-game-base-view-module";

// Initialize ViewConsumer with required dependencies
const viewConsumer = new ViewConsumer(
  definition,
  gameData,
  roundQuery,
  publisher,
  getBalance,
  userInfosRepository
);

// Initialize BaseViewRouter with full configuration
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

// Initialize publishers with required game data
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

# Release beta version
npm run release:beta
```

## Testing

The project includes comprehensive test coverage including:

- Unit tests using Jest
- Mutation testing with Stryker
- Coverage reporting
- Integration tests for socket communication
- Type checking with TypeScript

## Contributing

Please ensure all new features include:

- Appropriate test coverage
- TypeScript type definitions
- Documentation updates
- Adherence to existing code style
- Passing mutation tests

## License

ISC
