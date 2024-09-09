import { randomUUID } from 'crypto';
import { Scenes } from 'telegraf';
import { Enter, Hears, Scene } from 'telegraf-util';

@Scene('mini')
export class MiniScene {
	@Enter showWelcome(ctx: Scenes.SceneContext) {
		ctx.reply('Welcome to mini scene, type me uuid');
	}

	@Hears('uuid')
	async showUUID(ctx: Scenes.SceneContext) {
		await ctx.reply(`UUID\n\n${randomUUID()}`);
		await ctx.scene.leave();
	}
}
