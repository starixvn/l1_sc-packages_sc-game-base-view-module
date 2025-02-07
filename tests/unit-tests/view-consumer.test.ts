/** @format */

import { jest } from "@jest/globals";
import { Socket } from "socket.io";
import ViewConsumer from "../../src/view-consumer";

interface MockSocket {
    emit: jest.Mock;
}

interface GameConfigs {
    odds: number[];
    originalOdds: number[];
    enableFreeBet: boolean;
    boostedChoices: string[];
    enabled: boolean;
}

interface GameData {
    remainingTime: number;
    gameConfigs: GameConfigs;
    totalBets: Record<string, number>;
    roundId: string;
    delayStartTime: number;
    umMessages?: string[];
}

interface Definition {
    name: string;
    numberOfRoundHistory: number;
}

type RoundHistoryItem = {
    id: number;
    result: string;
};

interface RoundQuery {
    getList: jest.Mock;
}

interface Publisher {
    publish: jest.Mock;
}

interface UserInfosRepository {
    get: jest.Mock;
}

interface Dependencies {
    definition: Definition;
    gameData: GameData;
    roundQuery: RoundQuery;
    publisher: Publisher;
    getBalance: jest.Mock;
    userInfosRepository: UserInfosRepository;
}

describe("ViewConsumer", () => {
    let viewConsumer: ViewConsumer;
    let mockDependencies: Dependencies;
    let mockSocket: MockSocket;

    beforeEach(() => {
        mockSocket = {
            emit: jest.fn() as jest.Mock,
        };

        const roundHistory: RoundHistoryItem[] = [
            { id: 1, result: "win" },
            { id: 2, result: "loss" },
        ];

        const mockGetList = jest.fn() as jest.Mock;
        mockGetList.mockImplementation((count: number) => Promise.resolve(roundHistory));

        mockDependencies = {
            definition: {
                name: "test-game",
                numberOfRoundHistory: 10,
            },
            gameData: {
                remainingTime: 30,
                gameConfigs: {
                    odds: [1.5, 2.0],
                    originalOdds: [1.5, 2.0],
                    enableFreeBet: true,
                    boostedChoices: ["choice1", "choice2"],
                    enabled: true,
                },
                totalBets: { player1: 100 },
                roundId: "round-123",
                delayStartTime: 0,
            },
            roundQuery: {
                getList: mockGetList,
            },
            publisher: { publish: jest.fn() as jest.Mock },
            getBalance: jest.fn() as jest.Mock,
            userInfosRepository: { get: jest.fn() as jest.Mock },
        };

        viewConsumer = new ViewConsumer(
            mockDependencies.definition,
            mockDependencies.gameData,
            mockDependencies.roundQuery,
            mockDependencies.publisher,
            mockDependencies.getBalance,
            mockDependencies.userInfosRepository
        );
    });

    describe("consume", () => {
        it("should emit game disabled status when game is disabled", async () => {
            mockDependencies.gameData.gameConfigs.enabled = false;
            const umMessages = ["Maintenance in progress"];
            mockDependencies.gameData.umMessages = umMessages;

            await viewConsumer.consume(mockSocket as unknown as Socket);

            expect(mockSocket.emit).toHaveBeenCalledWith("test-game", {
                remainingTime: 30,
                um: true,
                um_message: umMessages,
            });
        });

        it("should emit game disabled status when delay start time is greater than 0", async () => {
            mockDependencies.gameData.delayStartTime = 5;
            const umMessages = ["Game starting soon"];
            mockDependencies.gameData.umMessages = umMessages;

            await viewConsumer.consume(mockSocket as unknown as Socket);

            expect(mockSocket.emit).toHaveBeenCalledWith("test-game", {
                remainingTime: 30,
                um: true,
                um_message: umMessages,
            });
        });

        it("should emit game data when game is enabled", async () => {
            const userId = "user-123";
            const expectedPayload = {
                remainingTime: 30,
                roundId: "round-123",
                gameConfigs: {
                    odds: [1.5, 2.0],
                    originalOdds: [1.5, 2.0],
                    enableFreeBet: true,
                    boostedChoices: ["choice1", "choice2"],
                },
                roundHistory: [
                    { id: 1, result: "win" },
                    { id: 2, result: "loss" },
                ],
                ownBets: {},
                totalBets: { player1: 100 },
            };

            await viewConsumer.consume(mockSocket as unknown as Socket, userId);

            expect(mockDependencies.roundQuery.getList).toHaveBeenCalledWith(10);
            expect(mockSocket.emit).toHaveBeenCalledWith("test-game", {
                [userId]: expectedPayload,
            });
        });
    });

    describe("buildPayload", () => {
        it("should build payload with all required fields", async () => {
            const result = await (viewConsumer as any).buildPayload();

            expect(result).toEqual({
                remainingTime: 30,
                roundId: "round-123",
                gameConfigs: {
                    odds: [1.5, 2.0],
                    originalOdds: [1.5, 2.0],
                    enableFreeBet: true,
                    boostedChoices: ["choice1", "choice2"],
                },
                roundHistory: [
                    { id: 1, result: "win" },
                    { id: 2, result: "loss" },
                ],
                ownBets: {},
                totalBets: { player1: 100 },
            });
        });

        it("should handle empty round history", async () => {
            mockDependencies.roundQuery.getList.mockResolvedValue([]);

            const result = await (viewConsumer as any).buildPayload();

            expect(result.roundHistory).toEqual([]);
        });
    });
}); 