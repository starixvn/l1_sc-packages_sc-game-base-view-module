import { Socket } from "socket.io";

export interface GameData {
    viewPlayers?: Record<string, Socket>;
    [key: string]: any;
}

export interface LogService {
    logError(error: Error | unknown): void;
}

export interface ViewConsumer {
    consume(socket: Socket, id?: string): Promise<void>;
}

export interface UserSignInConsumer {
    consume(socket: Socket, payload: any): Promise<void>;
}

export interface InGameConsumer {
    consume(socket: Socket, payload: any): Promise<void>;
}

export interface PlaceBetConsumer {
    consume(socket: Socket, payload: any): Promise<void>;
}

export interface UserDisconnectConsumer {
    consume(socket: Socket): Promise<void>;
}

export interface UserSignInPublisher {
    publish(data: any): Promise<void>;
}

export interface HistoryQuery {
    query(params: any): Promise<any>;
}

export interface PlayGamePermissionValidator {
    validate(params: any): Promise<boolean>;
}

export interface BaseViewRouterConfig {
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