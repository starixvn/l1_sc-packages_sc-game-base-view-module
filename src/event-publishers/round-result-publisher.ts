import { RoundResultPublisher as RoundResultPublisherBase } from "sc-game-base/src/core/event-publishers";
import GameData from "../types/GameData";

export default class RoundResultPublisher<T = {}> extends RoundResultPublisherBase {
    override publishWinners(roundId: number, winningPlayers: any) {
        // Implementation without console.log
    }

    publishToAllUsers(payload: any) {
        super.publishToAllUsers(payload);

        const gameData = this.gameData as GameData;
        Object.values(gameData.viewPlayers).forEach((socket) => {
            socket && socket.emit(this.gameName, payload);
        });
    }
}
