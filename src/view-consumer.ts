import { Socket } from "socket.io";

interface GameConfigs {
    odds: any;
    originalOdds: any;
    enableFreeBet: boolean;
    boostedChoices: any;
    enabled: boolean;
}

interface GameData {
    gameConfigs?: GameConfigs;
    remainingTime: number;
    umMessages?: any;
    delayStartTime?: number;
    totalBets: any;
    roundId: string;
}

interface Definition {
    name: string;
    numberOfRoundHistory: number;
}

interface RoundQuery {
    getList(numberOfRounds: number): Promise<any[]>;
}

interface Publisher {
    publish(data: any): Promise<void>;
}

interface GetBalance {
    (userId: string): Promise<number>;
}

interface UserInfosRepository {
    get(userId: string): Promise<any>;
}

export default class ViewConsumer {
    private definition: Definition;
    private gameData: GameData;
    private roundQuery: RoundQuery;
    private publisher: Publisher;
    private getBalance: GetBalance;
    private userInfosRepository: UserInfosRepository;

    constructor(
        definition: Definition,
        gameData: GameData,
        roundQuery: RoundQuery,
        publisher: Publisher,
        getBalance: GetBalance,
        userInfosRepository: UserInfosRepository
    ) {
        this.definition = definition;
        this.gameData = gameData;
        this.roundQuery = roundQuery;
        this.publisher = publisher;
        this.getBalance = getBalance;
        this.userInfosRepository = userInfosRepository;
    }

    public async consume(socketClient: Socket, id?: string): Promise<void> {
        const { remainingTime, gameConfigs, umMessages, delayStartTime } = this.gameData;
        const disabled = !gameConfigs || !gameConfigs.enabled || (delayStartTime ?? 0) > 0;

        if (disabled) {
            socketClient.emit(this.definition.name, { remainingTime, um: disabled, um_message: umMessages });
        } else {
            const payload = await this.buildPayload();
            socketClient.emit(this.definition.name, { [id ?? '']: payload });
        }
    }

    private async buildPayload(): Promise<{
        remainingTime: number;
        roundId: string;
        gameConfigs: Pick<GameConfigs, 'odds' | 'originalOdds' | 'enableFreeBet' | 'boostedChoices'>;
        roundHistory: any[];
        ownBets: Record<string, never>;
        totalBets: any;
    }> {
        const { odds = null, originalOdds = null, enableFreeBet = false, boostedChoices = null } = this.gameData.gameConfigs ?? {};
        const { totalBets, roundId, remainingTime } = this.gameData;
        const gameConfigs = { odds, originalOdds, enableFreeBet, boostedChoices };

        const roundHistory = await this.roundQuery.getList(this.definition.numberOfRoundHistory);

        return {
            remainingTime,
            roundId,
            gameConfigs,
            roundHistory,
            ownBets: {},
            totalBets,
        };
    }
} 