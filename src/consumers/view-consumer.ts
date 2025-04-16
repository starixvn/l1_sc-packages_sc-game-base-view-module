import { Socket } from "socket.io";
import { Table } from "sc-game-base";
import { RoundQuery } from "sc-game-base/src/core/query-apis";

export default class ViewConsumer {
    private definition: Table.TableGameDefinition;
    private gameData: any;
    private roundQuery: RoundQuery;

    constructor(
        definition: Table.TableGameDefinition,
        gameData: any,
        roundQuery: RoundQuery
    ) {
        this.definition = definition;
        this.gameData = gameData;
        this.roundQuery = roundQuery;
    }

    async consume(socketClient: Socket, id: string): Promise<void> {
        const { remainingTime, gameConfigs, umMessages, delayStartTime } = this.gameData;
        const disabled = !gameConfigs || !gameConfigs.enabled || delayStartTime > 0;

        if (disabled) {
            socketClient.emit(this.definition.name, { remainingTime, um: disabled, um_message: umMessages });
        } else {
            const payload = await this.buildPayload();
            socketClient.emit(this.definition.name, { [id]: payload });
        }
    }

    async buildPayload(): Promise<any> {
        const { odds, originalOdds, enableFreeBet, boostedChoices } = this.gameData.gameConfigs;
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
