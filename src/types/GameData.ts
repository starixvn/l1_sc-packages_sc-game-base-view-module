import { Socket } from "socket.io";
import { TableGameData as GameDataBase } from "sc-game-base/src/table";

// Generic type for extending with custom structures
export type ExtensibleType<T = {}> = T;

// ViewGameData interface with the core view-specific properties
export interface ViewGameData {
    viewPlayers: {
        [key: string]: Socket;
    };
}

// Generic type that allows extending GameData with custom properties
export type ExtendedGameData<T = {}> = GameDataBase & ViewGameData & T;

// GameData class that implements ViewGameData properties
export default class GameData extends GameDataBase implements ViewGameData {
    viewPlayers: { [key: string]: Socket } = {};

    constructor(wholeRoundDuration: number) {
        super(wholeRoundDuration);
    }
} 