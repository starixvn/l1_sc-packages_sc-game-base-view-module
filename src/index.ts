export { default as BaseViewRouter } from './routers/base-view-router';
export * from './types/types';
export { default as ViewConsumer } from './consumers/view-consumer';
export { default as GameStatusPublisher } from './event-publishers/game-status-publisher';
export { default as RoundResultPublisher } from './event-publishers/round-result-publisher';
export { registerViewModule } from './register-view-module';