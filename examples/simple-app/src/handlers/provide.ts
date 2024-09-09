import { UserHandler } from './UserHandler';

export interface IProvideHandlersConfig {
	repositoryURL: string;
}

export const provideHandlers = (config: IProvideHandlersConfig) => ({
	user: new UserHandler(config.repositoryURL)
});
