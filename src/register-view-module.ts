import { AwilixContainer } from "awilix";
import { BaseGameApp, GameDefinition } from "sc-game-base/src/core";
import { Socket } from "socket.io";

export const registerViewModule = (app: BaseGameApp, container: AwilixContainer, definition: GameDefinition) => {
    const gameNameInSocketNamespace = definition.name.toLowerCase();
    app.socketServer.of(`/view/${gameNameInSocketNamespace}`).on("connection", (socketClient: Socket) => {
        const baseViewRouter = container.resolve("baseViewRouter");
        baseViewRouter.init(socketClient);
    });
};
