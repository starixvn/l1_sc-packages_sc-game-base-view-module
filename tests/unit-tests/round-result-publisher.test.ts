/** @format */

import { jest } from "@jest/globals";
import { Core } from "sc-game-base";
import { Socket } from "socket.io";
import RoundResultPublisher from "../../src/round-result-publisher";

// Mock sc-game-base Core
jest.mock("sc-game-base", () => ({
    Core: {
        BaseEventPublishers: {
            RoundResultPublisher: jest.fn(),
        },
    },
}));

interface MockSocket {
    emit: jest.Mock;
}

interface GameData {
    viewPlayers?: Record<string, MockSocket>;
}

describe("RoundResultPublisher", () => {
    let publisher: RoundResultPublisher;
    let mockSocket: MockSocket;
    let mockGameData: GameData;
    let mockPayload: { roundResult: string };
    let mockSuperPublishToAllUsers: jest.Mock;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock socket
        mockSocket = {
            emit: jest.fn(async () => { }) as jest.Mock
        };

        // Create mock game data
        mockGameData = {
            viewPlayers: {
                player1: mockSocket,
                player2: mockSocket,
            },
        };

        // Create mock payload
        mockPayload = {
            roundResult: "test-result",
        };

        // Mock super.publishToAllUsers
        mockSuperPublishToAllUsers = jest.fn(async () => { }) as jest.Mock;
        (Core.BaseEventPublishers.RoundResultPublisher as jest.Mock).mockImplementation(() => ({
            publishToAllUsers: mockSuperPublishToAllUsers,
        }));

        // Create publisher instance
        publisher = new RoundResultPublisher();
        (publisher as any).gameData = mockGameData;
        (publisher as any).definition = { name: "test-event" };
    });

    describe("publishToAllUsers", () => {
        it("should call super.publishToAllUsers and emit to all view players", async () => {
            // Act
            await publisher.publishToAllUsers(mockPayload);

            // Assert
            expect(mockSuperPublishToAllUsers).toHaveBeenCalledWith(mockPayload);
            expect(mockSocket.emit).toHaveBeenCalledTimes(2);
            expect(mockSocket.emit).toHaveBeenNthCalledWith(
                1,
                "test-event",
                mockPayload
            );
            expect(mockSocket.emit).toHaveBeenNthCalledWith(
                2,
                "test-event",
                mockPayload
            );
        });

        it("should handle case when viewPlayers is undefined", async () => {
            // Arrange
            (publisher as any).gameData.viewPlayers = undefined;

            // Act
            await publisher.publishToAllUsers(mockPayload);

            // Assert
            expect(mockSuperPublishToAllUsers).toHaveBeenCalledWith(mockPayload);
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it("should continue processing other sockets when one socket emit fails", async () => {
            // Arrange
            const mockConsoleError = jest
                .spyOn(console, "error")
                .mockImplementation(() => { });
            const mockErrorSocket: MockSocket = {
                emit: jest.fn(async () => { throw new Error("Socket error"); }) as jest.Mock
            };
            (publisher as any).gameData.viewPlayers = {
                player1: mockErrorSocket,
                player2: mockSocket,
            };

            // Act
            await publisher.publishToAllUsers(mockPayload);

            // Assert
            expect(mockSuperPublishToAllUsers).toHaveBeenCalledWith(mockPayload);
            expect(mockErrorSocket.emit).toHaveBeenCalledWith(
                "test-event",
                mockPayload
            );
            expect(mockSocket.emit).toHaveBeenCalledWith("test-event", mockPayload);
            expect(mockConsoleError).toHaveBeenCalledWith(
                "Error emitting to socket:",
                expect.any(Error)
            );

            // Cleanup
            mockConsoleError.mockRestore();
        });

        it("should handle empty viewPlayers object", async () => {
            // Arrange
            (publisher as any).gameData.viewPlayers = {};

            // Act
            await publisher.publishToAllUsers(mockPayload);

            // Assert
            expect(mockSuperPublishToAllUsers).toHaveBeenCalledWith(mockPayload);
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });
    });
}); 