import { session, Telegraf } from 'telegraf';
import { TelegrafUtil } from 'telegraf-util';
import { HaveUsernameGuard } from './guards/HaveUsernameGuard';
import { provideHandlers } from './handlers/provide';
import { MiniScene } from './scenes/MiniScene';

async function main() {
	const bot = new Telegraf(process.env.TOKEN as string);
	const handlers = provideHandlers({
		repositoryURL: 'https://github.com/nickk48/telegraf-util'
	});

	bot.use(session());

	TelegrafUtil.bootstrap({
		telegraf: bot,
		handlers: [...Object.values(handlers), new MiniScene()],
		guards: [new HaveUsernameGuard()]
	});

	process.once('SIGINT', () => bot.stop());
	process.once('SIGTERM', () => bot.stop());

	await bot.launch();
}
main();
