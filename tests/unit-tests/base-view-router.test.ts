/** @format */

import { jest } from "@jest/globals";
import { Socket } from "socket.io";
import BaseViewRouter from "../../src/base-view-router";
import type { BaseViewRouterConfig, GameData, ViewConsumer, LogService } from "../../src/types/types";

jest.mock("socket.io");

// Create a test class that extends BaseViewRouter to access protected methods
class TestBaseViewRouter extends BaseViewRouter {
    public getGameData(): GameData {
        return (this as any).gameData;
    }

    public getSocketClient(): Socket {
        return (this as any).socketClient;
    }

    public verify(): boolean {
        return super.verify();
    }

    // These methods are private in the base class, but we need to test them
    public async testHandleInGame(payload?: { id?: string }): Promise<void> {
        return (this as any).handleInGame(payload);
    }

    public testHandleDisconnect(): void {
        return (this as any).handleDisconnect();
    }
}

describe("BaseViewRouter", () => {
    let baseViewRouter: TestBaseViewRouter;
    let mockSocket: any;
    let mockDependencies: BaseViewRouterConfig;

    beforeEach(() => {
        mockSocket = {
            id: "test-socket-id",
            on: jest.fn().mockReturnValue(true),
            emit: jest.fn().mockReturnValue(true),
        };

        const mockConsume = jest.fn<Promise<void>, [Socket, string | undefined]>()
            .mockImplementation(() => Promise.resolve());

        const mockLogError = jest.fn<void, [Error | unknown]>();

        const mockViewConsumer: ViewConsumer = {
            consume: mockConsume
        };

        const mockLogService: LogService = {
            logError: mockLogError
        };

        mockDependencies = {
            definition: { name: "test-game" },
            gameData: { viewPlayers: {} },
            userSignInConsumer: { consume: jest.fn() },
            inGameConsumer: { consume: jest.fn() },
            placeBetConsumer: { consume: jest.fn() },
            userDisconnectConsumer: { consume: jest.fn() },
            userSignInPublisher: { publish: jest.fn() },
            historyQuery: { query: jest.fn() },
            logService: mockLogService as LogService & { logError: jest.MockedFunction<typeof mockLogError> },
            playGamePermissionValidator: { validate: jest.fn() },
            viewConsumer: mockViewConsumer as ViewConsumer & { consume: jest.MockedFunction<typeof mockConsume> },
        };

        baseViewRouter = new TestBaseViewRouter(mockDependencies);
    });

    describe("init", () => {
        it("should initialize socket event listeners", () => {
            baseViewRouter.init(mockSocket as Socket);

            expect(mockSocket.on).toHaveBeenCalledWith(
                "inGame",
                expect.any(Function)
            );
            expect(mockSocket.on).toHaveBeenCalledWith(
                "disconnect",
                expect.any(Function)
            );
            expect(baseViewRouter.getSocketClient()).toBe(mockSocket);
        });
    });

    describe("handleInGame", () => {
        beforeEach(() => {
            baseViewRouter.init(mockSocket as Socket);
        });

        it("should handle inGame event successfully", async () => {
            const payload = { id: "test-id" };
            jest.spyOn(baseViewRouter, "verify").mockReturnValue(true);

            await baseViewRouter.testHandleInGame(payload);

            const gameData = baseViewRouter.getGameData();
            expect(gameData.viewPlayers?.[mockSocket.id]).toBe(mockSocket);
            expect(mockDependencies.viewConsumer.consume).toHaveBeenCalledWith(
                mockSocket,
                payload.id
            );
        });

        it("should not process if verification fails", async () => {
            jest.spyOn(baseViewRouter, "verify").mockReturnValue(false);

            await baseViewRouter.testHandleInGame({});

            expect(mockDependencies.viewConsumer.consume).not.toHaveBeenCalled();
        });

        it("should initialize viewPlayers if undefined", async () => {
            const gameData = baseViewRouter.getGameData();
            gameData.viewPlayers = undefined;
            jest.spyOn(baseViewRouter, "verify").mockReturnValue(true);

            await baseViewRouter.testHandleInGame({});

            expect(gameData.viewPlayers).toBeDefined();
            expect(typeof gameData.viewPlayers).toBe("object");
        });

        it("should log error if exception occurs", async () => {
            const error = new Error("Test error");
            (mockDependencies.viewConsumer.consume as jest.Mock).mockRejectedValue(error);
            jest.spyOn(baseViewRouter, "verify").mockReturnValue(true);

            await baseViewRouter.testHandleInGame({});

            expect(mockDependencies.logService.logError).toHaveBeenCalledWith(error);
        });
    });

    describe("handleDisconnect", () => {
        beforeEach(() => {
            baseViewRouter.init(mockSocket as Socket);
            jest.useFakeTimers();
            (mockDependencies.logService.logError as jest.Mock).mockClear();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("should remove player from viewPlayers after timeout", () => {
            const gameData = baseViewRouter.getGameData();
            gameData.viewPlayers = { [mockSocket.id]: mockSocket as Socket };

            baseViewRouter.testHandleDisconnect();
            jest.runAllTimers();

            expect(gameData.viewPlayers[mockSocket.id]).toBeUndefined();
        });

        it("should log error if exception occurs during disconnect", () => {
            const error = new Error("Test error");
            jest.spyOn(mockDependencies.logService, 'logError').mockImplementation(() => { });
            (mockDependencies.logService.logError as jest.Mock).mockImplementation(() => { });
            const gameData = baseViewRouter.getGameData();
            gameData.viewPlayers = new Proxy(
                {},
                {
                    deleteProperty: () => {
                        throw error;
                    },
                }
            );
            gameData.viewPlayers[mockSocket.id] = mockSocket as Socket;

            baseViewRouter.testHandleDisconnect();
            jest.runAllTimers();

            expect(mockDependencies.logService.logError).toHaveBeenCalledWith(error);
        });
    });

    describe("verify", () => {
        it("should return true by default", () => {
            expect(baseViewRouter.verify()).toBe(true);
        });
    });
}); 