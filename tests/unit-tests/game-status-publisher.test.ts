import { Core } from "sc-game-base";
import { Socket } from "socket.io";
import GameStatusPublisher from "../../src/game-status-publisher";

// Create mock functions
const mockPublishToAllUsers = jest.fn();
const mockPublishEnablingGameStatus = jest.fn();

// Mock the parent class
jest.mock("sc-game-base", () => {
    class MockBaseGameStatusPublisher {
        constructor() {
            // Bind methods to ensure proper 'this' context
            this.publishToAllUsers = this.publishToAllUsers.bind(this);
            this.publishEnablingGameStatus = this.publishEnablingGameStatus.bind(this);
        }

        publishToAllUsers(payload: any) {
            return mockPublishToAllUsers(payload);
        }

        publishEnablingGameStatus() {
            return mockPublishEnablingGameStatus();
        }
    }

    return {
        Core: {
            BaseEventPublishers: {
                GameStatusPublisher: MockBaseGameStatusPublisher
            }
        }
    };
});

describe("GameStatusPublisher", () => {
    let publisher: GameStatusPublisher;
    let mockSocket1: jest.Mocked<Socket>;
    let mockSocket2: jest.Mocked<Socket>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        console.log('Mocks cleared');

        // Create mock sockets with properly implemented emit function
        mockSocket1 = {
            emit: jest.fn().mockImplementation((event: string, ...args: any[]) => {
                console.log('mockSocket1.emit called with:', event, args);
                return Promise.resolve(true);
            }),
            id: 'player1',
            connected: true,
            volatile: { emit: jest.fn() }
        } as unknown as jest.Mocked<Socket>;

        mockSocket2 = {
            emit: jest.fn().mockImplementation((event: string, ...args: any[]) => {
                console.log('mockSocket2.emit called with:', event, args);
                return Promise.resolve(true);
            }),
            id: 'player2',
            connected: true,
            volatile: { emit: jest.fn() }
        } as unknown as jest.Mocked<Socket>;

        // Initialize publisher
        publisher = new GameStatusPublisher();
        console.log('Publisher initialized:', {
            isGameStatusPublisher: publisher instanceof GameStatusPublisher,
            hasPublishToAllUsers: typeof publisher.publishToAllUsers === 'function'
        });

        // Set required properties with default values
        publisher["gameData"] = {
            gameConfigs: {
                odds: {},
                originalOdds: {},
                enableFreeBet: false
            },
            remainingTime: 0,
            viewPlayers: {} // Initialize empty viewPlayers object
        };
        publisher["gameName"] = "testGame";
        console.log('Publisher properties set:', {
            gameName: publisher["gameName"],
            hasGameData: !!publisher["gameData"],
            hasViewPlayers: !!publisher["gameData"].viewPlayers,
            viewPlayersIsEmpty: publisher["gameData"].viewPlayers ? Object.keys(publisher["gameData"].viewPlayers).length === 0 : true
        });
    });

    describe("publishToAllUsers", () => {
        it("should call parent publishToAllUsers and emit to all view players when they exist", () => {
            // Arrange
            const testPayload = { test: "data" };

            // Set up viewPlayers
            publisher["gameData"].viewPlayers = {
                player1: mockSocket1,
                player2: mockSocket2
            };

            // Verify setup and inheritance
            console.log('Test setup complete:', {
                viewPlayers: {
                    exists: !!publisher["gameData"].viewPlayers,
                    count: Object.keys(publisher["gameData"].viewPlayers).length,
                    player1: {
                        exists: !!publisher["gameData"].viewPlayers?.player1,
                        hasEmit: typeof mockSocket1.emit === 'function',
                        id: mockSocket1.id
                    },
                    player2: {
                        exists: !!publisher["gameData"].viewPlayers?.player2,
                        hasEmit: typeof mockSocket2.emit === 'function',
                        id: mockSocket2.id
                    }
                },
                publisher: {
                    prototype: Object.getPrototypeOf(publisher),
                    hasPublishMethod: 'publishToAllUsers' in publisher,
                    publishIsFunction: typeof publisher.publishToAllUsers === 'function',
                    ownKeys: Object.keys(publisher),
                    gameData: {
                        exists: !!publisher["gameData"],
                        viewPlayersExists: !!publisher["gameData"]?.viewPlayers
                    }
                }
            });

            // Act
            console.log('About to call publishToAllUsers');
            publisher.publishToAllUsers(testPayload);
            console.log('publishToAllUsers called');

            // Debug the actual calls
            console.log('Mock states after call:', {
                socket1: {
                    emit: mockSocket1.emit.mock,
                    calls: mockSocket1.emit.mock.calls,
                    callCount: mockSocket1.emit.mock.calls.length
                },
                socket2: {
                    emit: mockSocket2.emit.mock,
                    calls: mockSocket2.emit.mock.calls,
                    callCount: mockSocket2.emit.mock.calls.length
                },
                parentPublish: {
                    calls: mockPublishToAllUsers.mock.calls,
                    callCount: mockPublishToAllUsers.mock.calls.length
                }
            });

            // Assert
            expect(mockPublishToAllUsers).toHaveBeenCalledWith(testPayload);
            expect(mockSocket1.emit).toHaveBeenCalledWith("testGame", testPayload);
            expect(mockSocket2.emit).toHaveBeenCalledWith("testGame", testPayload);
        });

        it("should only call parent publishToAllUsers when no view players exist", () => {
            // Arrange
            const testPayload = { test: "data" };
            // viewPlayers is undefined by default

            // Act
            publisher.publishToAllUsers(testPayload);

            // Assert
            expect(mockPublishToAllUsers).toHaveBeenCalledWith(testPayload);
            expect(mockSocket1.emit).not.toHaveBeenCalled();
            expect(mockSocket2.emit).not.toHaveBeenCalled();
        });

        it("should handle null/undefined sockets gracefully", () => {
            // Arrange
            const testPayload = { test: "data" };
            const viewPlayers: Record<string, Socket | null> = {
                player1: null,
                player2: mockSocket2,
            };
            publisher["gameData"] = {
                viewPlayers: viewPlayers as Record<string, Socket>,
                gameConfigs: {
                    odds: {},
                    originalOdds: {},
                    enableFreeBet: false
                },
                remainingTime: 0
            };
            publisher["gameName"] = "testGame";

            // Act
            publisher.publishToAllUsers(testPayload);

            // Assert
            expect(mockPublishToAllUsers).toHaveBeenCalledWith(testPayload);
            expect(mockSocket2.emit).toHaveBeenCalledWith("testGame", testPayload);
        });
    });

    describe("publishEnablingGameStatus", () => {
        it("should call parent publishEnablingGameStatus and emit to all view players with correct payload", () => {
            // Arrange
            const gameData = {
                viewPlayers: {
                    player1: mockSocket1,
                    player2: mockSocket2,
                },
                gameConfigs: {
                    odds: { test: "odds" },
                    originalOdds: { test: "originalOdds" },
                    enableFreeBet: true,
                    extraField: "should not be included",
                },
                remainingTime: 100,
            };
            publisher["gameData"] = gameData;
            publisher["gameName"] = "testGame";

            const expectedPayload = {
                gameConfigs: {
                    odds: { test: "odds" },
                    originalOdds: { test: "originalOdds" },
                    enableFreeBet: true,
                },
                remainingTime: 100,
                snr: true,
            };

            // Act
            publisher.publishEnablingGameStatus();

            // Assert
            expect(mockPublishEnablingGameStatus).toHaveBeenCalled();
            expect(mockSocket1.emit).toHaveBeenCalledWith("testGame", expectedPayload);
            expect(mockSocket2.emit).toHaveBeenCalledWith("testGame", expectedPayload);
        });

        it("should only call parent publishEnablingGameStatus when no view players exist", () => {
            // Arrange
            const gameData = {
                gameConfigs: {
                    odds: { test: "odds" },
                    originalOdds: { test: "originalOdds" },
                    enableFreeBet: true,
                },
                remainingTime: 100,
            };
            publisher["gameData"] = gameData;
            publisher["gameName"] = "testGame";

            // Act
            publisher.publishEnablingGameStatus();

            // Assert
            expect(mockPublishEnablingGameStatus).toHaveBeenCalled();
            expect(mockSocket1.emit).not.toHaveBeenCalled();
            expect(mockSocket2.emit).not.toHaveBeenCalled();
        });

        it("should handle null/undefined sockets gracefully", () => {
            // Arrange
            const viewPlayers: Record<string, Socket | null> = {
                player1: null,
                player2: mockSocket2,
            };
            const gameData = {
                viewPlayers: viewPlayers as Record<string, Socket>,
                gameConfigs: {
                    odds: { test: "odds" },
                    originalOdds: { test: "originalOdds" },
                    enableFreeBet: true,
                },
                remainingTime: 100,
            };
            publisher["gameData"] = gameData;
            publisher["gameName"] = "testGame";

            const expectedPayload = {
                gameConfigs: {
                    odds: { test: "odds" },
                    originalOdds: { test: "originalOdds" },
                    enableFreeBet: true,
                },
                remainingTime: 100,
                snr: true,
            };

            // Act
            publisher.publishEnablingGameStatus();

            // Assert
            expect(mockPublishEnablingGameStatus).toHaveBeenCalled();
            expect(mockSocket2.emit).toHaveBeenCalledWith("testGame", expectedPayload);
        });
    });
}); 