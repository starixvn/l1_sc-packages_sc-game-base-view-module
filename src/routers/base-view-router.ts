import { Socket } from "socket.io";
import ViewConsumer from "../consumers/view-consumer";

interface LogService {
    logError(error: Error | unknown): void;
}

interface RouterDependencies {
    gameData: any;
    logService: LogService;
    viewConsumer: ViewConsumer;
}

export default class BaseViewRouter {
    private gameData: any;
    private logService: LogService;
    private viewConsumer: ViewConsumer;
    private socketClient: Socket | undefined;

    constructor({
        gameData,
        logService,
        viewConsumer,
    }: RouterDependencies) {
        this.gameData = gameData;
        this.logService = logService;
        this.viewConsumer = viewConsumer;
    }

    init(socketClient: Socket): void {
        this.socketClient = socketClient;
        this.socketClient.on("inGame", this.handleInGame.bind(this));
        this.socketClient.on("disconnect", this.handleDisconnect.bind(this));
    }

    async handleInGame(payload?: { id?: string }): Promise<void> {
        try {
            if (!this.verify() || !this.socketClient) {
                return;
            }

            if (!this.gameData.viewPlayers) {
                this.gameData.viewPlayers = {};
            }

            this.gameData.viewPlayers[this.socketClient.id] = this.socketClient;
            await this.viewConsumer.consume(this.socketClient, payload?.id || "");
        } catch (error) {
            this.logService.logError(error);
        }
    }

    handleDisconnect(): void {
        try {
            setTimeout(() => {
                if (this.gameData.viewPlayers && this.socketClient) {
                    delete this.gameData.viewPlayers[this.socketClient.id];
                }
            });
        } catch (error) {
            this.logService.logError(error);
        }
    }

    verify(): boolean {
        return true;
    }
} 