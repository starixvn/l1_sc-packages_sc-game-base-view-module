import { Socket } from "socket.io";

export interface GameConfigs {
    odds: any;
    originalOdds: any;
    enableFreeBet: boolean;
    boostedChoices?: any;
    enabled: boolean;
}

export interface GameData {
    viewPlayers?: Record<string, Socket>;
    gameConfigs?: GameConfigs;
    remainingTime: number;
    umMessages?: any;
    delayStartTime?: number;
    totalBets?: any;
    roundId?: string;
}

export interface Definition {
    name: string;
    numberOfRoundHistory: number;
}

export interface RoundQuery {
    getList(numberOfRounds: number): Promise<any[]>;
}

export interface Publisher {
    publish(data: any): Promise<void>;
}

export interface GetBalance {
    (userId: string): Promise<number>;
}

export interface UserInfosRepository {
    get(userId: string): Promise<any>;
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