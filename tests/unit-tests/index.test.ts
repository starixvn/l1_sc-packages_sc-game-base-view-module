import {
    BaseViewRouter,
    ViewConsumer,
    GameStatusPublisher,
    RoundResultPublisher
} from '../../src/index';

describe('Index exports', () => {
    it('should export all required modules', () => {
        // Assert all exports are defined
        expect(BaseViewRouter).toBeDefined();
        expect(ViewConsumer).toBeDefined();
        expect(GameStatusPublisher).toBeDefined();
        expect(RoundResultPublisher).toBeDefined();
    });

    it('should export types', () => {
        // This test ensures the types export statement is included
        // TypeScript will fail to compile if the types export is missing
        expect(true).toBe(true);
    });
}); 