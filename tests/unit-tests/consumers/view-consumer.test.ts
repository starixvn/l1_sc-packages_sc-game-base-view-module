import { Socket } from 'socket.io';
import ViewConsumer from '../../../src/consumers/view-consumer';
import type { GameData } from '../../../src/types/types';

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

    // Consolidated test for disabled states
    describe('disabled states', () => {
        const testCases = [
            {
                desc: 'undefined gameConfigs',
                gameData: { ...defaultGameData, gameConfigs: undefined }
            },
            {
                desc: 'disabled gameConfigs',
                gameData: {
                    ...defaultGameData,
                    gameConfigs: { ...defaultGameData.gameConfigs, enabled: false }
                }
            },
            {
                desc: 'with delay start time',
                gameData: { ...defaultGameData, delayStartTime: 5000 }
            }
        ];

        testCases.forEach(({ desc, gameData }) => {
            it(`should handle ${desc}`, async () => {
                // Arrange
                const viewConsumer = new ViewConsumer(
                    defaultDefinition,
                    gameData,
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
        });
    });

    // Consolidated test for missing or empty IDs
    describe('missing or empty IDs', () => {
        const testCases = [
            { desc: 'undefined id', id: undefined },
            { desc: 'empty string id', id: '' }
        ];

        testCases.forEach(({ desc, id }) => {
            it(`should handle ${desc}`, async () => {
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
                await viewConsumer.consume(mockSocket, id);

                // Assert
                expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
                    [id ?? '']: {
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
        });
    });

    // Consolidated test for gameConfigs properties
    describe('gameConfigs properties', () => {
        const testCases = [
            {
                desc: 'null properties',
                gameConfigs: {
                    enabled: true,
                    odds: null,
                    originalOdds: null,
                    enableFreeBet: false,
                    boostedChoices: null
                }
            },
            {
                desc: 'undefined properties',
                gameConfigs: {
                    enabled: true,
                    odds: undefined,
                    originalOdds: undefined,
                    enableFreeBet: false,
                    boostedChoices: undefined
                }
            },
            {
                desc: 'mixed null and undefined',
                gameConfigs: {
                    enabled: true,
                    odds: null,
                    originalOdds: undefined,
                    enableFreeBet: false,
                    boostedChoices: null
                }
            }
        ];

        testCases.forEach(({ desc, gameConfigs }) => {
            it(`should handle ${desc}`, async () => {
                // Arrange
                const viewConsumer = new ViewConsumer(
                    defaultDefinition,
                    { ...defaultGameData, gameConfigs },
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
    });

    // Consolidated test for round history
    it('should handle round history correctly', async () => {
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
                roundHistory: mockRoundHistory,
                gameConfigs: expect.any(Object),
                remainingTime: expect.any(Number),
                roundId: expect.any(String),
                ownBets: expect.any(Object),
                totalBets: expect.any(Object)
            })
        });
        expect(mockRoundQuery.getList).toHaveBeenCalledWith(5);
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

    // Test umMessages functionality
    describe('umMessages in disabled states', () => {
        const testCases = [
            {
                desc: 'with maintenance message',
                gameData: {
                    ...defaultGameData,
                    gameConfigs: undefined,
                    umMessages: 'Game is under maintenance'
                },
                expectedMessage: 'Game is under maintenance'
            },
            {
                desc: 'with disabled config and message',
                gameData: {
                    ...defaultGameData,
                    gameConfigs: { ...defaultGameData.gameConfigs, enabled: false },
                    umMessages: 'Game is temporarily disabled'
                },
                expectedMessage: 'Game is temporarily disabled'
            }
        ];

        testCases.forEach(({ desc, gameData, expectedMessage }) => {
            it(`should handle ${desc}`, async () => {
                // Arrange
                const viewConsumer = new ViewConsumer(
                    defaultDefinition,
                    gameData,
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
                    um_message: expectedMessage
                });
            });
        });
    });

    // Additional test cases for 100% branch coverage
    describe('edge cases for buildPayload', () => {
        it('should handle completely undefined gameConfigs', async () => {
            // Arrange
            const gameDataWithoutConfigs: GameData = {
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

        it('should handle partial gameConfigs with only enabled flag', async () => {
            // Arrange
            const partialGameData: GameData = {
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

    describe('complex disabled states combinations', () => {
        const testCases = [
            {
                desc: 'undefined gameConfigs with delayStartTime',
                gameData: {
                    ...defaultGameData,
                    gameConfigs: undefined,
                    delayStartTime: 1000,
                    umMessages: undefined
                } as GameData
            },
            {
                desc: 'disabled gameConfigs with delayStartTime and umMessages',
                gameData: {
                    ...defaultGameData,
                    gameConfigs: {
                        odds: null,
                        originalOdds: null,
                        enableFreeBet: false,
                        boostedChoices: null,
                        enabled: false
                    },
                    delayStartTime: 1000,
                    umMessages: 'Delayed and disabled'
                } as GameData
            },
            {
                desc: 'enabled gameConfigs but with delayStartTime',
                gameData: {
                    ...defaultGameData,
                    delayStartTime: 1000,
                    umMessages: 'Delayed start'
                } as GameData
            }
        ];

        testCases.forEach(({ desc, gameData }) => {
            it(`should handle ${desc}`, async () => {
                // Arrange
                const viewConsumer = new ViewConsumer(
                    defaultDefinition,
                    gameData,
                    mockRoundQuery,
                    mockPublisher,
                    mockGetBalance,
                    mockUserInfosRepository
                );

                // Act
                await viewConsumer.consume(mockSocket);

                // Assert
                expect(mockSocket.emit).toHaveBeenCalledWith('testGame', {
                    remainingTime: gameData.remainingTime,
                    um: true,
                    um_message: gameData.umMessages
                });
            });
        });
    });
}); 