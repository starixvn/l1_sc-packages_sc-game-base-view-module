import { Socket } from 'socket.io';
import ViewConsumer from '../../src/view-consumer';

describe('ViewConsumer', () => {
    // Mock dependencies
    let mockSocket: jest.Mocked<Socket>;
    let mockRoundQuery: jest.Mocked<any>;
    let mockPublisher: jest.Mocked<any>;
    let mockGetBalance: jest.Mock;
    let mockUserInfosRepository: jest.Mocked<any>;

    // Test data
    const defaultDefinition = {
        name: 'testGame',
        numberOfRoundHistory: 5
    };

    const defaultGameData = {
        remainingTime: 30,
        roundId: 'round123',
        totalBets: {},
        gameConfigs: {
            odds: { '1': 2.0 },
            originalOdds: { '1': 1.8 },
            enableFreeBet: true,
            boostedChoices: ['1'],
            enabled: true
        }
    };

    beforeEach(() => {
        // Initialize mocks
        mockSocket = {
            emit: jest.fn()
        } as any;

        mockRoundQuery = {
            getList: jest.fn().mockResolvedValue([])
        };

        mockPublisher = {
            publish: jest.fn().mockResolvedValue(undefined)
        };

        mockGetBalance = jest.fn().mockResolvedValue(1000);

        mockUserInfosRepository = {
            get: jest.fn().mockResolvedValue({})
        };
    });

    // Happy path test
    it('should emit game data when game is enabled', async () => {
        // Arrange
        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            defaultGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: { '1': 2.0 },
                    originalOdds: { '1': 1.8 },
                    enableFreeBet: true,
                    boostedChoices: ['1']
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
        expect(mockRoundQuery.getList).toHaveBeenCalledWith(5);
    });

    // Test disabled game scenarios
    it('should emit disabled state when gameConfigs is undefined', async () => {
        // Arrange
        const gameDataWithoutConfigs = {
            ...defaultGameData,
            gameConfigs: undefined
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithoutConfigs,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket);

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            remainingTime: 30,
            um: true,
            um_message: undefined
        });
    });

    it('should emit disabled state when game is explicitly disabled', async () => {
        // Arrange
        const gameDataDisabled = {
            ...defaultGameData,
            gameConfigs: {
                ...defaultGameData.gameConfigs,
                enabled: false
            }
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataDisabled,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket);

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            remainingTime: 30,
            um: true,
            um_message: undefined
        });
    });

    it('should emit disabled state when delayStartTime is greater than 0', async () => {
        // Arrange
        const gameDataWithDelay = {
            ...defaultGameData,
            delayStartTime: 5000
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithDelay,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket);

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            remainingTime: 30,
            um: true,
            um_message: undefined
        });
    });

    // Test edge cases
    it('should handle undefined gameConfigs properties gracefully', async () => {
        // Arrange
        const gameDataMinimal = {
            remainingTime: 30,
            roundId: 'round123',
            totalBets: {},
            gameConfigs: {
                odds: null,
                originalOdds: null,
                enableFreeBet: false,
                boostedChoices: null,
                enabled: true
            }
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataMinimal,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: null,
                    originalOdds: null,
                    enableFreeBet: false,
                    boostedChoices: null
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    it('should handle round history data correctly', async () => {
        // Arrange
        const mockRoundHistory = [
            { id: 'round1', result: 'win' },
            { id: 'round2', result: 'loss' }
        ];

        mockRoundQuery.getList.mockResolvedValueOnce(mockRoundHistory);

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            defaultGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: expect.objectContaining({
                roundHistory: mockRoundHistory
            })
        });
    });

    // Error handling test
    it('should handle roundQuery errors gracefully', async () => {
        // Arrange
        mockRoundQuery.getList.mockRejectedValueOnce(new Error('Database error'));

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            defaultGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act & Assert
        await expect(viewConsumer.consume(mockSocket, 'user123')).rejects.toThrow('Database error');
    });

    // Test consume method without id parameter
    it('should emit game data when id is not provided', async () => {
        // Arrange
        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            defaultGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket);

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            '': {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: { '1': 2.0 },
                    originalOdds: { '1': 1.8 },
                    enableFreeBet: true,
                    boostedChoices: ['1']
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    // Test umMessages functionality
    it('should emit disabled state with umMessages', async () => {
        // Arrange
        const gameDataWithMessages = {
            ...defaultGameData,
            gameConfigs: undefined,
            umMessages: 'Game is under maintenance'
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithMessages,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket);

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            remainingTime: 30,
            um: true,
            um_message: 'Game is under maintenance'
        });
    });

    // Test buildPayload with null gameConfigs
    it('should handle completely null gameConfigs', async () => {
        // Arrange
        const gameDataNullConfigs = {
            ...defaultGameData,
            gameConfigs: undefined
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataNullConfigs,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            remainingTime: 30,
            um: true,
            um_message: undefined
        });
    });

    // Test buildPayload with partial gameConfigs
    it('should handle partial gameConfigs properties', async () => {
        // Arrange
        const partialGameData = {
            ...defaultGameData,
            gameConfigs: {
                enabled: true,
                odds: { '1': 2.0 },
                originalOdds: undefined,
                enableFreeBet: false,
                boostedChoices: undefined
            }
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            partialGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: { '1': 2.0 },
                    originalOdds: null,
                    enableFreeBet: false,
                    boostedChoices: null
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    // Test delayStartTime with zero value
    it('should not disable game when delayStartTime is zero', async () => {
        // Arrange
        const gameDataWithZeroDelay = {
            ...defaultGameData,
            delayStartTime: 0
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithZeroDelay,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: { '1': 2.0 },
                    originalOdds: { '1': 1.8 },
                    enableFreeBet: true,
                    boostedChoices: ['1']
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    // Test buildPayload with completely null gameData
    it('should handle completely null gameData properties', async () => {
        // Arrange
        const nullGameData = {
            remainingTime: 30,
            roundId: 'round123',
            totalBets: {},
            gameConfigs: {
                enabled: true,
                odds: null,
                originalOdds: null,
                enableFreeBet: false,
                boostedChoices: null
            }
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            nullGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: null,
                    originalOdds: null,
                    enableFreeBet: false,
                    boostedChoices: null
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    // Test buildPayload with undefined gameConfigs
    it('should handle undefined gameConfigs in buildPayload', async () => {
        // Arrange
        const gameDataWithoutConfigs = {
            remainingTime: 30,
            roundId: 'round123',
            totalBets: {},
            gameConfigs: undefined
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithoutConfigs,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            remainingTime: 30,
            um: true,
            um_message: undefined
        });
    });

    // Test when game is disabled but has both gameConfigs and umMessages
    it('should emit disabled state with umMessages even when gameConfigs exist', async () => {
        // Arrange
        const gameDataWithMessagesAndConfigs = {
            ...defaultGameData,
            gameConfigs: {
                ...defaultGameData.gameConfigs,
                enabled: false
            },
            umMessages: 'Game is temporarily disabled'
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithMessagesAndConfigs,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket);

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            remainingTime: 30,
            um: true,
            um_message: 'Game is temporarily disabled'
        });
    });

    // Test when delayStartTime is undefined
    it('should not disable game when delayStartTime is undefined', async () => {
        // Arrange
        const gameDataWithUndefinedDelay = {
            ...defaultGameData,
            delayStartTime: undefined
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithUndefinedDelay,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: { '1': 2.0 },
                    originalOdds: { '1': 1.8 },
                    enableFreeBet: true,
                    boostedChoices: ['1']
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    // Test when gameConfigs exists but has undefined properties
    it('should handle gameConfigs with undefined properties', async () => {
        // Arrange
        const gameDataWithUndefinedProps = {
            remainingTime: 30,
            roundId: 'round123',
            totalBets: {},
            gameConfigs: {
                enabled: true,
                odds: undefined,
                originalOdds: undefined,
                enableFreeBet: false,
                boostedChoices: undefined
            }
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithUndefinedProps,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: null,
                    originalOdds: null,
                    enableFreeBet: false,
                    boostedChoices: null
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    // Test with empty string id
    it('should handle empty string id correctly', async () => {
        // Arrange
        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            defaultGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, '');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            '': {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: { '1': 2.0 },
                    originalOdds: { '1': 1.8 },
                    enableFreeBet: true,
                    boostedChoices: ['1']
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    // Test with non-empty round history
    it('should handle non-empty round history', async () => {
        // Arrange
        const mockRoundHistory = [
            { id: 'round1', result: 'win' },
            { id: 'round2', result: 'loss' }
        ];
        mockRoundQuery.getList.mockResolvedValueOnce(mockRoundHistory);

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            defaultGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: { '1': 2.0 },
                    originalOdds: { '1': 1.8 },
                    enableFreeBet: true,
                    boostedChoices: ['1']
                },
                roundHistory: mockRoundHistory,
                ownBets: {},
                totalBets: {}
            }
        });
        expect(mockRoundQuery.getList).toHaveBeenCalledWith(5);
    });

    // Test error handling in roundQuery.getList
    it('should handle roundQuery.getList error', async () => {
        // Arrange
        const queryError = new Error('Database connection failed');
        mockRoundQuery.getList.mockRejectedValueOnce(queryError);

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            defaultGameData,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act & Assert
        await expect(viewConsumer.consume(mockSocket, 'user123')).rejects.toThrow('Database connection failed');
        expect(mockRoundQuery.getList).toHaveBeenCalledWith(5);
    });

    // Test when gameConfigs is undefined
    it('should handle undefined gameConfigs', async () => {
        // Arrange
        const gameDataWithUndefinedConfigs = {
            remainingTime: 30,
            roundId: 'round123',
            totalBets: {},
            gameConfigs: undefined
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithUndefinedConfigs,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            remainingTime: 30,
            um: true,
            um_message: undefined
        });
    });

    // Test when gameConfigs properties are null
    it('should handle null values in gameConfigs properties', async () => {
        // Arrange
        const gameDataWithNullProps = {
            remainingTime: 30,
            roundId: 'round123',
            totalBets: {},
            gameConfigs: {
                enabled: true,
                odds: null,
                originalOdds: null,
                enableFreeBet: false,
                boostedChoices: null
            }
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithNullProps,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: null,
                    originalOdds: null,
                    enableFreeBet: false,
                    boostedChoices: null
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });

    // Test when gameConfigs has mixed null and undefined properties
    it('should handle mixed null and undefined values in gameConfigs', async () => {
        // Arrange
        const gameDataWithMixedProps = {
            remainingTime: 30,
            roundId: 'round123',
            totalBets: {},
            gameConfigs: {
                enabled: true,
                odds: null,
                originalOdds: undefined,
                enableFreeBet: false,
                boostedChoices: null
            }
        };

        const viewConsumer = new ViewConsumer(
            defaultDefinition,
            gameDataWithMixedProps,
            mockRoundQuery,
            mockPublisher,
            mockGetBalance,
            mockUserInfosRepository
        );

        // Act
        await viewConsumer.consume(mockSocket, 'user123');

        // Assert
        expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
            user123: {
                remainingTime: 30,
                roundId: 'round123',
                gameConfigs: {
                    odds: null,
                    originalOdds: null,
                    enableFreeBet: false,
                    boostedChoices: null
                },
                roundHistory: [],
                ownBets: {},
                totalBets: {}
            }
        });
    });
}); 