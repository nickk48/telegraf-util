import { randomUUID } from 'crypto';
import { Markup, Scenes } from 'telegraf';
import { Action, Enter, Hears, Scene } from 'telegraf-util';
import { SceneId } from './constants';

@Scene(SceneId.MINI)
export class MiniScene {
	@Enter showWelcome(ctx: Scenes.SceneContext) {
		ctx.reply(
			'Welcome to mini scene, type me uuid',
			Markup.inlineKeyboard([Markup.button.callback('Click', 'simple_button')])
		);
	}

	@Hears('uuid')
	async showUUID(ctx: Scenes.SceneContext) {
		await ctx.reply(`UUID\n\n${randomUUID()}`);
		await ctx.scene.leave();
	}

	@Action('simple_button')
	async handleSimpleButton(ctx: Scenes.SceneContext) {
		await ctx.answerCbQuery('☑️');
	}
}
