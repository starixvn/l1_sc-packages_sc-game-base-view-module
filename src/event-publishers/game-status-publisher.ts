import { GameStatusPublisher as GameStatusPublisherBase } from "sc-game-base/src/core/event-publishers";
import GameData from "../types/GameData";

export default class GameStatusPublisher<T = {}> extends GameStatusPublisherBase {
    override publishToAllUsers(payload: any): void {
        super.publishToAllUsers(payload);

        const gameData = this.gameData as GameData;
        Object.values(gameData.viewPlayers).forEach((socket) => {
            socket && socket.emit(this.gameName, payload);
        });
    }

    override publishEnablingGameStatus(): void {
        super.publishEnablingGameStatus();

        const { gameConfigs, remainingTime } = this.gameData;
        const configs = {
            odds: gameConfigs.odds,
            originalOdds: gameConfigs.originalOdds,
            enableFreeBet: gameConfigs.enableFreeBet,
        };

        const gameData = this.gameData as GameData;
        Object.values(gameData.viewPlayers).forEach((socket) => {
            const payload = { gameConfigs: { ...configs }, remainingTime, snr: true };
            socket && socket.emit(this.gameName, payload);
        });
    }
} 