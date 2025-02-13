import { Application } from 'express';
import { AwilixContainer } from 'awilix';
import { Server as SocketServer } from 'socket.io';
import BaseViewRouter from './routers/base-view-router';
import { Definition } from './types/types';

export const registerViewModule = (
    app: Application & { socketServer: SocketServer },
    container: AwilixContainer,
    definition: Definition
): void => {
    const gameNameInSocketNamespace = definition.name.toLowerCase();
    console.log("app", app, app.socketServer);

    app.socketServer.of(`/view/${gameNameInSocketNamespace}`).on("connection", (socketClient) => {
        const baseViewRouter = container.resolve<BaseViewRouter>("baseViewRouter");
        baseViewRouter.init(socketClient);
    });
}; 