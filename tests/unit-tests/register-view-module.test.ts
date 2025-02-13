import { Application } from 'express';
import { AwilixContainer } from 'awilix';
import { Server as SocketServer, Socket } from 'socket.io';
import { registerViewModule } from '../../src/register-view-module';
import BaseViewRouter from '../../src/routers/base-view-router';
import { Definition } from '../../src/types/types';

jest.mock('socket.io');

describe('registerViewModule', () => {
    let mockApp: jest.Mocked<Application & { socketServer: SocketServer }>;
    let mockContainer: jest.Mocked<AwilixContainer>;
    let mockSocketServer: jest.Mocked<SocketServer>;
    let mockNamespace: jest.Mocked<any>;
    let mockSocketClient: jest.Mocked<Socket>;
    let mockBaseViewRouter: jest.Mocked<BaseViewRouter>;
    let definition: Definition;

    beforeEach(() => {
        // Mock socket client
        mockSocketClient = {
            // Add any socket client methods that might be used
        } as unknown as jest.Mocked<Socket>;

        // Mock namespace
        mockNamespace = {
            on: jest.fn(),
        };

        // Mock socket server
        mockSocketServer = {
            of: jest.fn().mockReturnValue(mockNamespace),
        } as unknown as jest.Mocked<SocketServer>;

        // Mock Express app
        mockApp = {
            socketServer: mockSocketServer,
        } as unknown as jest.Mocked<Application & { socketServer: SocketServer }>;

        // Mock base view router
        mockBaseViewRouter = {
            init: jest.fn(),
        } as unknown as jest.Mocked<BaseViewRouter>;

        // Mock container
        mockContainer = {
            resolve: jest.fn().mockReturnValue(mockBaseViewRouter),
        } as unknown as jest.Mocked<AwilixContainer>;

        // Define test definition
        definition = {
            name: 'TestGame',
            numberOfRoundHistory: 10
        };

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should create socket namespace with correct game name', () => {
        // Arrange
        const expectedNamespace = '/view/testgame';

        // Act
        registerViewModule(mockApp, mockContainer, definition);

        // Assert
        expect(mockApp.socketServer.of).toHaveBeenCalledWith(expectedNamespace);
    });

    it('should set up connection handler for socket namespace', () => {
        // Act
        registerViewModule(mockApp, mockContainer, definition);

        // Assert
        expect(mockNamespace.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should resolve and initialize baseViewRouter when client connects', () => {
        // Arrange
        registerViewModule(mockApp, mockContainer, definition);
        const connectionHandler = mockNamespace.on.mock.calls[0][1];

        // Act
        connectionHandler(mockSocketClient);

        // Assert
        expect(mockContainer.resolve).toHaveBeenCalledWith('baseViewRouter');
        expect(mockBaseViewRouter.init).toHaveBeenCalledWith(mockSocketClient);
    });

    it('should handle game names with special characters correctly', () => {
        // Arrange
        definition.name = 'Test-Game_123';
        const expectedNamespace = '/view/test-game_123';

        // Act
        registerViewModule(mockApp, mockContainer, definition);

        // Assert
        expect(mockApp.socketServer.of).toHaveBeenCalledWith(expectedNamespace);
    });

    it('should log app and socketServer information', () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'log');

        // Act
        registerViewModule(mockApp, mockContainer, definition);

        // Assert
        expect(consoleSpy).toHaveBeenCalledWith('app', mockApp, mockApp.socketServer);
        consoleSpy.mockRestore();
    });

    it('should handle errors when resolving baseViewRouter', () => {
        // Arrange
        const error = new Error('Resolution error');
        mockContainer.resolve.mockImplementation(() => {
            throw error;
        });
        registerViewModule(mockApp, mockContainer, definition);
        const connectionHandler = mockNamespace.on.mock.calls[0][1];

        // Act & Assert
        expect(() => connectionHandler(mockSocketClient)).toThrow(error);
    });
}); 