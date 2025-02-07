<!-- @format -->

# sc-game-base-view-module

A reusable view module for sc-game-base applications that provides common view-related functionality.

## Installation

```bash
npm install sc-game-base-view-module
```

## Components

### BaseViewRouter

Handles socket connections and routing for view-only clients. Manages player connections and disconnections.

### GameStatusPublisher

Extends the base GameStatusPublisher to include view-only clients in game status updates.

### RoundResultPublisher

Extends the base RoundResultPublisher to include view-only clients in round result updates.

### ViewConsumer

Handles view-only client requests and builds appropriate payloads for them.

## Usage

```javascript
import {
  BaseViewRouter,
  GameStatusPublisher,
  RoundResultPublisher,
  ViewConsumer,
} from "sc-game-base-view-module";

// Initialize components
const viewRouter = new BaseViewRouter({
  definition,
  gameData,
  viewConsumer,
  // ... other dependencies
});

const gameStatusPublisher = new GameStatusPublisher({
  gameData,
  // ... other dependencies
});

const roundResultPublisher = new RoundResultPublisher({
  gameData,
  // ... other dependencies
});

const viewConsumer = new ViewConsumer(
  definition,
  gameData,
  roundQuery,
  publisher,
  getBalance,
  userInfosRepository
);

// Use with socket.io
io.on("connection", (socket) => {
  viewRouter.init(socket);
});
```

## Dependencies

- sc-game-base (>= 4.0.0)
- socket.io (^4.0.0)

## License

ISC
