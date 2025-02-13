import { Core } from "sc-game-base";
import { GameData, Definition } from "../types/types";

export default class RoundResultPublisher extends Core.BaseEventPublishers.RoundResultPublisher {
    protected gameData!: GameData;
    protected definition!: Definition;

    public async publishToAllUsers(payload: any): Promise<void> {
        await super.publishToAllUsers(payload);

        if (this.gameData.viewPlayers) {
            const sockets = Object.values(this.gameData.viewPlayers);
            await Promise.all(
                sockets.map(async (socket) => {
                    try {
                        await socket.emit(this.definition.name, payload);
                    } catch (error) {
                        console.error("Error emitting to socket:", error);
                    }
                })
            );
        }
    }
} 