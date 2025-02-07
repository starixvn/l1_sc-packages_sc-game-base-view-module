import { Socket } from "socket.io";
import { BaseViewRouterConfig } from "./types/types";

export default class BaseViewRouter {
    private definition: any;
    private gameData: BaseViewRouterConfig["gameData"];
    private userSignInConsumer: BaseViewRouterConfig["userSignInConsumer"];
    private inGameConsumer: BaseViewRouterConfig["inGameConsumer"];
    private placeBetConsumer: BaseViewRouterConfig["placeBetConsumer"];
    private userDisconnectConsumer: BaseViewRouterConfig["userDisconnectConsumer"];
    private userSignInPublisher: BaseViewRouterConfig["userSignInPublisher"];
    private historyQuery: BaseViewRouterConfig["historyQuery"];
    private logService: BaseViewRouterConfig["logService"];
    private playGamePermissionValidator: BaseViewRouterConfig["playGamePermissionValidator"];
    private viewConsumer: BaseViewRouterConfig["viewConsumer"];
    private socketClient!: Socket;

    constructor({
        definition,
        gameData,
        userSignInConsumer,
        inGameConsumer,
        placeBetConsumer,
        userDisconnectConsumer,
        userSignInPublisher,
        historyQuery,
        logService,
        playGamePermissionValidator,
        viewConsumer,
    }: BaseViewRouterConfig) {
        this.definition = definition;
        this.gameData = gameData;
        this.userSignInConsumer = userSignInConsumer;
        this.inGameConsumer = inGameConsumer;
        this.placeBetConsumer = placeBetConsumer;
        this.userDisconnectConsumer = userDisconnectConsumer;
        this.userSignInPublisher = userSignInPublisher;
        this.historyQuery = historyQuery;
        this.logService = logService;
        this.playGamePermissionValidator = playGamePermissionValidator;
        this.viewConsumer = viewConsumer;
    }

    public init(socketClient: Socket): void {
        this.socketClient = socketClient;
        this.socketClient.on("inGame", this.handleInGame.bind(this));
        this.socketClient.on("disconnect", this.handleDisconnect.bind(this));
    }

    private async handleInGame(payload?: { id?: string }): Promise<void> {
        try {
            if (!this.verify()) {
                return;
            }

            if (!this.gameData.viewPlayers) {
                this.gameData.viewPlayers = {};
            }

            this.gameData.viewPlayers[this.socketClient.id] = this.socketClient;
            await this.viewConsumer.consume(this.socketClient, payload?.id);
        } catch (error) {
            this.logService.logError(error);
        }
    }

    private handleDisconnect(): void {
        try {
            setTimeout(() => {
                try {
                    if (this.gameData.viewPlayers) {
                        delete this.gameData.viewPlayers[this.socketClient.id];
                    }
                } catch (error) {
                    this.logService.logError(error);
                }
            }, 0);
        } catch (error) {
            this.logService.logError(error);
        }
    }

    protected verify(): boolean {
        return true;
    }
} 