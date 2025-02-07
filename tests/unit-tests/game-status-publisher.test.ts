/** @format */

import { jest } from "@jest/globals";
import { Core } from "sc-game-base";
import { Socket } from "socket.io";
import GameStatusPublisher from "../../src/game-status-publisher";

jest.mock("sc-game-base", () => ({
    Core: {
        BaseEventPublishers: {
            GameStatusPublisher: jest.fn().mockImplementation(() => ({
                publishToAllUsers: jest.fn(),
                publishEnablingGameStatus: jest.fn(),
            })),
        },
    },
}));

interface MockSocket {
    emit: jest.Mock;
}

interface GameData {
    viewPlayers: Record<string, MockSocket | null>;
    gameConfigs: {
        odds: number[];
        originalOdds: number[];
        enableFreeBet: boolean;
    };
    remainingTime: number;
}

describe("GameStatusPublisher", () => {
    let gameStatusPublisher: GameStatusPublisher;
    let mockGameData: GameData;
    let mockSocket1: MockSocket;
    let mockSocket2: MockSocket;

    beforeEach(() => {
        mockSocket1 = { emit: jest.fn() as jest.Mock };
        mockSocket2 = { emit: jest.fn() as jest.Mock };

        mockGameData = {
            viewPlayers: {
                player1: mockSocket1,
                player2: mockSocket2,
            },
            gameConfigs: {
                odds: [1.5, 2.0],
                originalOdds: [1.5, 2.0],
                enableFreeBet: true,
            },
            remainingTime: 30,
        };

        gameStatusPublisher = new GameStatusPublisher();
        (gameStatusPublisher as any).gameData = mockGameData;
        (gameStatusPublisher as any).gameName = "test-game";
    });

    describe("publishToAllUsers", () => {
        it("should publish to all view players", () => {
            const payload = { status: "active" };

            gameStatusPublisher.publishToAllUsers(payload);

            expect(
                Core.BaseEventPublishers.GameStatusPublisher.prototype.publishToAllUsers
            ).toHaveBeenCalledWith(payload);
            expect(mockSocket1.emit).toHaveBeenCalledWith("test-game", payload);
            expect(mockSocket2.emit).toHaveBeenCalledWith("test-game", payload);
        });

        it("should handle null socket gracefully", () => {
            mockGameData.viewPlayers.player1 = null;
            const payload = { status: "active" };

            gameStatusPublisher.publishToAllUsers(payload);

            expect(mockSocket2.emit).toHaveBeenCalledWith("test-game", payload);
        });
    });

    describe("publishEnablingGameStatus", () => {
        it("should publish enabling game status to all view players", () => {
            gameStatusPublisher.publishEnablingGameStatus();

            expect(
                Core.BaseEventPublishers.GameStatusPublisher.prototype
                    .publishEnablingGameStatus
            ).toHaveBeenCalled();

            const expectedPayload = {
                gameConfigs: {
                    odds: mockGameData.gameConfigs.odds,
                    originalOdds: mockGameData.gameConfigs.originalOdds,
                    enableFreeBet: mockGameData.gameConfigs.enableFreeBet,
                },
                remainingTime: mockGameData.remainingTime,
                snr: true,
            };

            expect(mockSocket1.emit).toHaveBeenCalledWith(
                "test-game",
                expectedPayload
            );
            expect(mockSocket2.emit).toHaveBeenCalledWith(
                "test-game",
                expectedPayload
            );
        });

        it("should handle null socket gracefully during enabling status", () => {
            mockGameData.viewPlayers.player2 = null;

            gameStatusPublisher.publishEnablingGameStatus();

            const expectedPayload = {
                gameConfigs: {
                    odds: mockGameData.gameConfigs.odds,
                    originalOdds: mockGameData.gameConfigs.originalOdds,
                    enableFreeBet: mockGameData.gameConfigs.enableFreeBet,
                },
                remainingTime: mockGameData.remainingTime,
                snr: true,
            };

            expect(mockSocket1.emit).toHaveBeenCalledWith(
                "test-game",
                expectedPayload
            );
        });
    });
}); 