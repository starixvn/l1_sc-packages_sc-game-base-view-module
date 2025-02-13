import { Core } from "sc-game-base";
import { Socket } from "socket.io";

interface GameData {
    viewPlayers?: Record<string, Socket>;
    gameConfigs: {
        odds: any;
        originalOdds: any;
        enableFreeBet: boolean;
    };
    remainingTime: number;
}

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