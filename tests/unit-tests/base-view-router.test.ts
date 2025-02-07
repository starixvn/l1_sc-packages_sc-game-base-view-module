import { Socket } from "socket.io";
import BaseViewRouter from "../../src/base-view-router";
import { BaseViewRouterConfig } from "../../src/types/types";

describe('BaseViewRouter', () => {
    // Mock dependencies
    let mockSocket: jest.Mocked<Socket>;
    let mockGameData: any;
    let mockLogService: any;
    let mockViewConsumer: any;
    let routerConfig: BaseViewRouterConfig;
    let router: BaseViewRouter;

    beforeEach(() => {
        // Setup mock socket
        mockSocket = {
            id: 'test-socket-id',
            on: jest.fn(),
        } as unknown as jest.Mocked<Socket>;

        // Setup mock game data
        mockGameData = {
            viewPlayers: {}
        };

        // Setup mock log service
        mockLogService = {
            logError: jest.fn()
        };

        // Setup mock view consumer
        mockViewConsumer = {
            consume: jest.fn()
        };

        // Setup router config with properly mocked consumers
        routerConfig = {
            definition: {},
            gameData: mockGameData,
            userSignInConsumer: { consume: jest.fn() },
            inGameConsumer: { consume: jest.fn() },
            placeBetConsumer: { consume: jest.fn() },
            userDisconnectConsumer: { consume: jest.fn() },
            userSignInPublisher: { publish: jest.fn() },
            historyQuery: { query: jest.fn() },
            logService: mockLogService,
            playGamePermissionValidator: { validate: jest.fn() },
            viewConsumer: mockViewConsumer,
        };

        router = new BaseViewRouter(routerConfig);
    });

    describe('init', () => {
        it('should initialize socket event listeners', () => {
            // Act
            router.init(mockSocket);

            // Assert
            expect(mockSocket.on).toHaveBeenCalledTimes(2);
            expect(mockSocket.on).toHaveBeenCalledWith('inGame', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        });
    });

    describe('handleInGame', () => {
        beforeEach(() => {
            router.init(mockSocket);
        });

        it('should handle inGame event with valid payload', async () => {
            // Arrange
            const payload = { id: 'test-game-id' };

            // Get the inGame handler
            const [[, inGameHandler]] = (mockSocket.on as jest.Mock).mock.calls;

            // Act
            await inGameHandler(payload);

            // Assert
            expect(mockGameData.viewPlayers[mockSocket.id]).toBe(mockSocket);
            expect(mockViewConsumer.consume).toHaveBeenCalledWith(mockSocket, 'test-game-id');
        });

        it('should handle inGame event without payload', async () => {
            // Get the inGame handler
            const [[, inGameHandler]] = (mockSocket.on as jest.Mock).mock.calls;

            // Act
            await inGameHandler();

            // Assert
            expect(mockGameData.viewPlayers[mockSocket.id]).toBe(mockSocket);
            expect(mockViewConsumer.consume).toHaveBeenCalledWith(mockSocket, undefined);
        });

        it('should initialize viewPlayers if undefined', async () => {
            // Arrange
            mockGameData.viewPlayers = undefined;
            const [[, inGameHandler]] = (mockSocket.on as jest.Mock).mock.calls;

            // Act
            await inGameHandler();

            // Assert
            expect(mockGameData.viewPlayers).toBeDefined();
            expect(mockGameData.viewPlayers[mockSocket.id]).toBe(mockSocket);
        });

        it('should handle errors during inGame processing', async () => {
            // Arrange
            const error = new Error('Test error');
            mockViewConsumer.consume.mockRejectedValue(error);
            const [[, inGameHandler]] = (mockSocket.on as jest.Mock).mock.calls;

            // Act
            await inGameHandler();

            // Assert
            expect(mockLogService.logError).toHaveBeenCalledWith(error);
        });

        it('should not proceed when verify returns false', async () => {
            // Arrange
            const payload = { id: 'test-game-id' };
            jest.spyOn(router as any, 'verify').mockReturnValue(false);
            const [[, inGameHandler]] = (mockSocket.on as jest.Mock).mock.calls;

            // Act
            await inGameHandler(payload);

            // Assert
            expect(mockViewConsumer.consume).not.toHaveBeenCalled();
            expect(mockGameData.viewPlayers[mockSocket.id]).toBeUndefined();
        });

        it('should handle errors when setting viewPlayers', async () => {
            // Arrange
            const error = new Error('Failed to set viewPlayers');
            Object.defineProperty(mockGameData, 'viewPlayers', {
                set: () => {
                    throw error;
                },
                get: () => undefined
            });
            const [[, inGameHandler]] = (mockSocket.on as jest.Mock).mock.calls;

            // Act
            await inGameHandler();

            // Assert
            expect(mockLogService.logError).toHaveBeenCalledWith(error);
        });

        it('should handle null payload', async () => {
            // Arrange
            const [[, inGameHandler]] = (mockSocket.on as jest.Mock).mock.calls;

            // Act
            await inGameHandler(null);

            // Assert
            expect(mockGameData.viewPlayers[mockSocket.id]).toBe(mockSocket);
            expect(mockViewConsumer.consume).toHaveBeenCalledWith(mockSocket, undefined);
        });

        it('should handle empty object payload', async () => {
            // Arrange
            const [[, inGameHandler]] = (mockSocket.on as jest.Mock).mock.calls;

            // Act
            await inGameHandler({});

            // Assert
            expect(mockGameData.viewPlayers[mockSocket.id]).toBe(mockSocket);
            expect(mockViewConsumer.consume).toHaveBeenCalledWith(mockSocket, undefined);
        });
    });

    describe('handleDisconnect', () => {
        beforeEach(() => {
            router.init(mockSocket);
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should remove player from viewPlayers on disconnect', () => {
            // Arrange
            mockGameData.viewPlayers[mockSocket.id] = mockSocket;
            const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
                call => call[0] === 'disconnect'
            )[1];

            // Act
            disconnectHandler();
            jest.runAllTimers();

            // Assert
            expect(mockGameData.viewPlayers[mockSocket.id]).toBeUndefined();
        });

        it('should handle errors during disconnect', () => {
            // Arrange
            mockGameData.viewPlayers[mockSocket.id] = mockSocket;
            Object.defineProperty(mockGameData, 'viewPlayers', {
                get: () => {
                    throw new Error('Disconnect error');
                }
            });
            const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
                call => call[0] === 'disconnect'
            )[1];

            // Act
            disconnectHandler();
            jest.runAllTimers();

            // Assert
            expect(mockLogService.logError).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle case when viewPlayers is undefined during disconnect', () => {
            // Arrange
            mockGameData.viewPlayers = undefined;
            const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
                call => call[0] === 'disconnect'
            )[1];

            // Act
            disconnectHandler();
            jest.runAllTimers();

            // Assert
            expect(mockLogService.logError).not.toHaveBeenCalled();
        });

        it('should handle delete operation error during disconnect', () => {
            // Arrange
            const error = new Error('Delete operation failed');
            mockGameData.viewPlayers = new Proxy({}, {
                deleteProperty: () => {
                    throw error;
                }
            });
            const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
                call => call[0] === 'disconnect'
            )[1];

            // Act
            disconnectHandler();
            jest.runAllTimers();

            // Assert
            expect(mockLogService.logError).toHaveBeenCalledWith(error);
        });

        it('should handle error in setTimeout creation', () => {
            // Arrange
            const error = new Error('setTimeout error');
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = jest.fn().mockImplementation(() => {
                throw error;
            }) as unknown as typeof global.setTimeout;

            const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
                call => call[0] === 'disconnect'
            )[1];

            // Act
            disconnectHandler();

            // Assert
            expect(mockLogService.logError).toHaveBeenCalledWith(error);

            // Cleanup
            global.setTimeout = originalSetTimeout;
        });
    });

    describe('verify', () => {
        it('should return true by default', () => {
            // Act
            const result = router['verify']();

            // Assert
            expect(result).toBe(true);
        });
    });

    // Test verify method
    it('should return true by default from verify method', () => {
        // Arrange
        class TestRouter extends BaseViewRouter {
            public testVerify(): boolean {
                return this.verify();
            }
        }

        const router = new TestRouter({
            definition: {},
            gameData: {},
            userSignInConsumer: { consume: jest.fn() },
            inGameConsumer: { consume: jest.fn() },
            placeBetConsumer: { consume: jest.fn() },
            userDisconnectConsumer: { consume: jest.fn() },
            userSignInPublisher: { publish: jest.fn() },
            historyQuery: { query: jest.fn() },
            logService: { logError: jest.fn() },
            playGamePermissionValidator: { validate: jest.fn() },
            viewConsumer: { consume: jest.fn() }
        });

        // Act
        const result = router.testVerify();

        // Assert
        expect(result).toBe(true);
    });

    // Test error handling in handleInGame
    it('should handle errors in handleInGame', async () => {
        // Arrange
        const mockError = new Error('Test error');
        const mockLogService = { logError: jest.fn() };
        const mockSocket = {
            id: 'test-socket-id',
            on: jest.fn(),
        } as any;

        const mockViewConsumer = {
            consume: jest.fn().mockRejectedValue(mockError)
        };

        const router = new BaseViewRouter({
            definition: {},
            gameData: { viewPlayers: {} },
            userSignInConsumer: { consume: jest.fn() },
            inGameConsumer: { consume: jest.fn() },
            placeBetConsumer: { consume: jest.fn() },
            userDisconnectConsumer: { consume: jest.fn() },
            userSignInPublisher: { publish: jest.fn() },
            historyQuery: { query: jest.fn() },
            logService: mockLogService,
            playGamePermissionValidator: { validate: jest.fn() },
            viewConsumer: mockViewConsumer
        });

        // Initialize router
        router.init(mockSocket);

        // Get the inGame handler
        const [[, inGameHandler]] = mockSocket.on.mock.calls;

        // Act
        await inGameHandler({ id: 'test-id' });

        // Assert
        expect(mockLogService.logError).toHaveBeenCalledWith(mockError);
    });
}); 