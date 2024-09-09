import { Writable } from 'node:stream';
import { Context, Telegraf } from 'telegraf';
import { Message } from 'telegraf/types';
import { DocumentWriteStream } from './DocumentWriteStream';

type MaybeArray<T> = T | T[];
export type TTriggers<C extends Context> = MaybeArray<
	string | RegExp | TriggerFn<C>
>;
type TriggerFn<C extends Context> = (
	value: string,
	ctx: C
) => RegExpExecArray | null;

export type TConstructor = { new (...args: any[]): NonNullable<unknown> };
export type TMethod = (...args: any[]) => any;

export type TContext = {
	kind: string;
	name: string | symbol;
	access: {
		get?(): unknown;
		set?(value: unknown): void;
		has?(value: unknown): boolean;
	};
	private?: boolean;
	static?: boolean;
	addInitializer(initializer: () => void): void;
};

export interface IBootstrapConfig<T extends object> {
	telegraf: Telegraf;
	handlers: T[];
	guards?: IGuard[];
}

export type THandler = Record<string, (telegraf: Telegraf) => void>;

export type THandlerType = 'command' | 'hears' | 'action' | 'event';

export type TEventName = 'text' | 'audio' | 'animation' | 'document';

export type TCreateTelegrafHandlerConfig = {
	type: THandlerType;
	value: Function;
	telegraf: Telegraf;
	pattern?: TTriggers<any> | null;
	eventNames?: TEventName[];
};

export interface IGuard {
	handle(ctx: Context): Promise<boolean> | boolean;

	get name(): string;
}

export type TGuardConstructor = { new (...args: any[]): IGuard };

export interface IReadDocumentOfCtxConfig<
	T extends Writable = DocumentWriteStream
> {
	ctx: Context;
	writer?: T;
	validate?: (
		document: Message.DocumentMessage['document']
	) => boolean | Promise<boolean>;
}
