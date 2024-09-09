import { randomInt, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { Context, Telegraf } from 'telegraf';
import {
	Command,
	Guard,
	Hears,
	InjectBot,
	IReadDocumentOfCtxConfig,
	OnEvent,
	TelegrafUtil
} from 'telegraf-util';
import { SceneContext } from 'telegraf/scenes';
import { UserButtons, UserButtonText } from '../buttons/UserButtons';
import { HaveUsernameGuard } from '../guards/HaveUsernameGuard';
import { SceneId } from '../scenes/constants';

export class UserHandler {
	@InjectBot private readonly _bot!: Telegraf<Context>;

	constructor(
		private readonly _repositoryURL: string,
		private readonly _sticker = 'https://tlgrm.eu/_/stickers/525/34a/52534aab-4208-36b3-a265-d72e8aae6e5d/1.webp'
	) {}

	@Command('start')
	@Guard(HaveUsernameGuard)
	async showWelcome(ctx: Context) {
		const senderId = TelegrafUtil.senderIdOfCtx(ctx);
		await this._bot.telegram.sendMessage(senderId, 'Welcome to bot');
		await ctx.replyWithMarkdownV2('_Options_', UserButtons.generalMenu);
	}

	@Command('help')
	async showAboutBot(ctx: Context) {
		await ctx.replyWithMarkdownV2(
			'*Its simple bot for example use telegraf-util*'
		);
	}

	@Hears(Object.values(UserButtonText))
	async handleButtons(ctx: SceneContext) {
		const text = TelegrafUtil.textOfCtx(ctx);

		switch (text) {
			case UserButtonText.GET_REPO_LINK:
				return void ctx.replyWithHTML(this._gitLinkWithCode);
			case UserButtonText.GET_STICKER:
				return void ctx.replyWithSticker(this._sticker);
			case UserButtonText.SCENE:
				return void ctx.scene.enter(SceneId.MINI);
			default:
				break;
		}
	}

	@Hears(UserButtons.textRefresh.text)
	async refreshButtons(ctx: Context) {
		UserButtons.textRefresh.hide = true;
		await ctx.replyWithMarkdownV2('*Refreshed*', UserButtons.generalMenu);
	}

	@OnEvent('document')
	async onTextDocument(ctx: Context) {
		UserButtons.textRefresh.hide = false;

		const fns = [
			this._saveFile.bind(this),
			this._saveFileWithStream.bind(this)
		];

		const fn = fns[randomInt(fns.length)];

		await fn(ctx, async ({ mime_type }) => {
			if (!mime_type) {
				await ctx.reply('Unknown file format');
				return false;
			}
			return mime_type.startsWith('text/');
		});
	}

	private async _saveFile(
		ctx: Context,
		validate: IReadDocumentOfCtxConfig['validate']
	) {
		let fileName: string | undefined;

		const stream = await TelegrafUtil.readDocumentOfCtx({
			ctx,
			async validate(document) {
				fileName = document.file_name;
				if (validate) return validate(document);
				return true;
			}
		});

		if (!stream) return;

		if (fileName) {
			const buffer = await stream.getFinalBuffer();
			await writeFile(fileName, buffer);
		}
	}

	private async _saveFileWithStream(
		ctx: Context,
		_: IReadDocumentOfCtxConfig['validate']
	) {
		await TelegrafUtil.readDocumentOfCtx({
			ctx,
			writer: createWriteStream(`./${randomUUID()}.txt`)
		});
	}

	private get _gitLinkWithCode() {
		return `${this._repositoryURL}\n\n<pre language="typescript">import { randomUUID } from 'crypto';
import { Scenes } from 'telegraf';
import { Enter, Hears, Scene } from 'telegraf-util';

@Scene('mini')
export class MiniScene {
	@Enter showWelcome(ctx: Scenes.SceneContext) {
		ctx.reply('Welcome to mini scene, type me uuid');
	}

	@Hears('uuid')
	async showUUID(ctx: Scenes.SceneContext) {
		await ctx.reply(randomUUID());
		await ctx.scene.leave();
	}
}</pre>`;
	}
}
