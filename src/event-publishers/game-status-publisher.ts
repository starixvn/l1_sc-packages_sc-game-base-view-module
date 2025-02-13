import { Core } from "sc-game-base";
import { GameData } from "../types/types";

export default class GameStatusPublisher extends Core.BaseEventPublishers.GameStatusPublisher {
    protected gameData!: GameData;
    protected gameName!: string;

    public publishToAllUsers(payload: any): void {
        super.publishToAllUsers(payload);

        if (this.gameData.viewPlayers) {
            Object.values(this.gameData.viewPlayers).forEach((socket) => {
                socket?.emit(this.gameName, payload);
            });
        }
    }

    public publishEnablingGameStatus(): void {
        super.publishEnablingGameStatus();

        const { gameConfigs, remainingTime } = this.gameData;
        if (!gameConfigs) return;

        const configs = {
            odds: gameConfigs.odds,
            originalOdds: gameConfigs.originalOdds,
            enableFreeBet: gameConfigs.enableFreeBet,
        };

        if (this.gameData.viewPlayers) {
            Object.values(this.gameData.viewPlayers).forEach((socket) => {
                const payload = { gameConfigs: { ...configs }, remainingTime, snr: true };
                socket?.emit(this.gameName, payload);
            });
        }
    }
} 