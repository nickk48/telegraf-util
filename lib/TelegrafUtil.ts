import axios from 'axios';
import { Writable } from 'node:stream';
import { Context, Scenes, Telegraf } from 'telegraf';
import { MetaKey } from './constants';
import { DocumentWriteStream } from './DocumentWriteStream';
import {
	IBootstrapConfig,
	IGuard,
	IReadDocumentOfCtxConfig,
	THandler
} from './types';

export class TelegrafUtil {
	static bootstrap<T extends object>(config: IBootstrapConfig<T>): void {
		const scenes = config.handlers.filter(el => el instanceof Scenes.BaseScene);

		if (scenes.length > 0) {
			config.telegraf.use(new Scenes.Stage(scenes).middleware());
		}

		for (const handler of config.handlers) {
			this._initHandler(config.telegraf, <THandler>handler, config.guards);
		}
	}

	static async readDocumentOfCtx<T extends Writable = DocumentWriteStream>({
		ctx,
		validate,
		writer = new DocumentWriteStream() as unknown as T
	}: IReadDocumentOfCtxConfig<T>) {
		const document = TelegrafUtil.documentOfCtx(ctx);
		if (!document) return null;

		if (validate) {
			const isValid = await validate(document);
			if (!isValid) return null;
		}

		const link = await ctx.telegram.getFileLink(document.file_id);
		const res = await axios.get(link.toString(), { responseType: 'stream' });

		res.data.pipe(writer);
		return writer;
	}

	static documentOfCtx(ctx: Context) {
		if ('document' in ctx.message!) {
			return ctx.message.document;
		}
		return null;
	}

	static textOfCtx({ message }: Context): string {
		if ('text' in message!) return message.text;
		return '';
	}

	static senderIdOfCtx({ from }: Context): number {
		if (!from || !from.id) return 0;
		return from.id;
	}

	private static _initHandler(
		telegraf: Telegraf,
		handler: THandler,
		guards: IGuard[] = []
	): void {
		const guardsMeta = Reflect.get(handler, MetaKey.GUARDS);

		for (const key in guardsMeta) {
			const guardNames = <string[]>guardsMeta[key];

			for (let i = 0; i < guardNames.length; i++) {
				const guard = guards.find(guard => guard.name === guardNames[i]);
				if (guard) {
					guardsMeta[key][i] = guard;
				}
			}
		}

		const botField = <string | undefined>(
			Reflect.get(handler, MetaKey.BOT_FIELD)
		);

		if (botField) {
			(handler as unknown as Record<string, Telegraf>)[botField] = telegraf;
			Reflect.deleteProperty(handler, MetaKey.BOT_FIELD);
		}

		const keys: (keyof typeof MetaKey)[] = [
			'NAMES_ACTION',
			'NAMES_HEARS',
			'NAMES_ENTER',
			'NAMES_COMMAND',
			'NAMES_EVENT'
		];

		for (const key of keys) {
			const methodNames = <string[] | undefined>(
				Reflect.get(<object>handler, MetaKey[key])
			);

			if (methodNames)
				methodNames.forEach(methodName => {
					handler[methodName].call(handler, telegraf);
				});

			Reflect.deleteProperty(handler, key);
		}
	}
}
