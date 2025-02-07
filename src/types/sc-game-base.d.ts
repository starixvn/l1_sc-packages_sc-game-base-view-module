declare module 'sc-game-base' {
    export namespace Core {
        namespace BaseEventPublishers {
            class GameStatusPublisher {
                protected gameData: any;
                protected gameName: string;
                publishToAllUsers(payload: any): void;
                publishEnablingGameStatus(): void;
            }

            class RoundResultPublisher {
                protected gameData: any;
                protected definition: any;
                publishToAllUsers(payload: any): Promise<void>;
            }
        }
    }
} 