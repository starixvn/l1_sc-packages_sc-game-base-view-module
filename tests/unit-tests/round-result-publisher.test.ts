import { Core } from "sc-game-base";
import { Socket } from "socket.io";
import RoundResultPublisher from "../../src/round-result-publisher";

// Create mock functions
const mockParentPublishToAllUsers = jest.fn();

// Mock the parent class
jest.mock("sc-game-base", () => {
    class MockBaseRoundResultPublisher {
        constructor() {
            // Bind methods to ensure proper 'this' context
            this.publishToAllUsers = this.publishToAllUsers.bind(this);
        }

        publishToAllUsers(payload: any) {
            return mockParentPublishToAllUsers(payload);
        }
    }

    return {
        Core: {
            BaseEventPublishers: {
                RoundResultPublisher: MockBaseRoundResultPublisher
            }
        }
    };
});

describe("RoundResultPublisher", () => {
    let publisher: RoundResultPublisher;
    let mockSocket1: jest.Mocked<Socket>;
    let mockSocket2: jest.Mocked<Socket>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset the parent mock implementation
        mockParentPublishToAllUsers.mockClear();

        // Create mock sockets with properly typed emit function
        mockSocket1 = {
            emit: jest.fn().mockImplementation((event: string, ...args: any[]) => Promise.resolve(true)),
            // Add other required Socket.io properties as needed
        } as unknown as jest.Mocked<Socket>;

        mockSocket2 = {
            emit: jest.fn().mockImplementation((event: string, ...args: any[]) => Promise.resolve(true)),
            // Add other required Socket.io properties as needed
        } as unknown as jest.Mocked<Socket>;

        // Initialize publisher
        publisher = new RoundResultPublisher();

        // Set required properties
        (publisher as any).definition = { name: "testEvent" };
    });

    describe("publishToAllUsers", () => {
        const testPayload = { data: "test" };

        it("should call parent publishToAllUsers and not emit when no viewPlayers exist", async () => {
            // Arrange
            (publisher as any).gameData = {};

            // Act
            await publisher.publishToAllUsers(testPayload);

            // Assert
            expect(mockParentPublishToAllUsers).toHaveBeenCalledTimes(1);
            expect(mockParentPublishToAllUsers).toHaveBeenCalledWith(testPayload);
            expect(mockSocket1.emit).not.toHaveBeenCalled();
        });

        it("should emit to all view players when they exist", async () => {
            // Arrange
            (publisher as any).gameData = {
                viewPlayers: {
                    "player1": mockSocket1,
                    "player2": mockSocket2,
                },
            };

            // Act
            await publisher.publishToAllUsers(testPayload);

            // Assert
            expect(mockParentPublishToAllUsers).toHaveBeenCalledTimes(1);
            expect(mockParentPublishToAllUsers).toHaveBeenCalledWith(testPayload);
            expect(mockSocket1.emit).toHaveBeenCalledWith("testEvent", testPayload);
            expect(mockSocket2.emit).toHaveBeenCalledWith("testEvent", testPayload);
        });

        it("should handle socket emission errors gracefully", async () => {
            // Arrange
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            const emitError = new Error("Emission failed");
            (mockSocket1.emit as jest.Mock).mockRejectedValueOnce(emitError);

            (publisher as any).gameData = {
                viewPlayers: {
                    "player1": mockSocket1,
                    "player2": mockSocket2,
                },
            };

            // Act
            await publisher.publishToAllUsers(testPayload);

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error emitting to socket:",
                emitError
            );
            expect(mockParentPublishToAllUsers).toHaveBeenCalledTimes(1);
            expect(mockParentPublishToAllUsers).toHaveBeenCalledWith(testPayload);
            expect(mockSocket2.emit).toHaveBeenCalledWith("testEvent", testPayload);

            // Cleanup
            consoleSpy.mockRestore();
        });

        it("should handle empty viewPlayers object", async () => {
            // Arrange
            (publisher as any).gameData = {
                viewPlayers: {},
            };

            // Act
            await publisher.publishToAllUsers(testPayload);

            // Assert
            expect(mockParentPublishToAllUsers).toHaveBeenCalledTimes(1);
            expect(mockParentPublishToAllUsers).toHaveBeenCalledWith(testPayload);
            expect(mockSocket1.emit).not.toHaveBeenCalled();
            expect(mockSocket2.emit).not.toHaveBeenCalled();
        });
    });
}); 