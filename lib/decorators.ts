import { Context, Scenes, Telegraf } from 'telegraf';
import { MetaKey } from './constants';
import {
	TConstructor,
	TContext,
	TEventName,
	TGuardConstructor,
	TMethod,
	TTriggers
} from './types';
import { Util } from './Util';

export const Action = (triggers: TTriggers<any>): TMethod =>
	Util.createListenerDecorator('action', 'NAMES_ACTION', triggers);

export const Hears = (triggers: TTriggers<any>): TMethod =>
	Util.createListenerDecorator('hears', 'NAMES_HEARS', triggers);

export const Command = (triggers: TTriggers<any>): TMethod =>
	Util.createListenerDecorator('command', 'NAMES_COMMAND', triggers);

export const OnEvent = (...eventNames: TEventName[]): TMethod =>
	Util.createListenerDecorator('event', 'NAMES_EVENT', null, eventNames);

export const OnText = (...ignorePatterns: string[]) => {
	const combinedPattern = ignorePatterns
		.map(pattern => `(?:${pattern})`)
		.join('|');

	return Hears(new RegExp(`^(?!.*(${combinedPattern})).*$`));
};

export function InjectBot<This, T extends Context>(
	_: undefined,
	{ addInitializer, name }: ClassFieldDecoratorContext<This, Telegraf<T>>
) {
	addInitializer(function (this: any) {
		Reflect.set(this, MetaKey.BOT_FIELD, name);
	});

	return (value: Telegraf<T>) => value;
}

export function Guard(...guards: TGuardConstructor[]): TMethod {
	return <T extends TMethod>(
		value: T,
		{ name, addInitializer }: TContext
	): TMethod => {
		addInitializer(function (this: any) {
			if (guards.length === 0) return;

			const guardNames = guards.map(guard => (guard as TGuardConstructor).name);
			const metaKey = MetaKey.GUARDS;

			if (!Reflect.has(this, MetaKey.GUARDS))
				return void Reflect.set(this, metaKey, {
					[name]: guardNames
				});

			const guardsMeta = Reflect.get(this, metaKey);
			guardsMeta[name] = guardNames;
		});

		return value;
	};
}

export function Enter(
	value: Function,
	context: ClassMethodDecoratorContext
): any {
	context.addInitializer(function (this: any) {
		Util.addMethodNames(this, 'NAMES_ENTER', <string>context.name);
	});

	return function (this: Scenes.BaseScene) {
		this.enter(async (ctx: Context) => {
			const hasAccess = await Util.useGuards<Scenes.BaseScene>(
				this,
				ctx,
				<string>context.name
			);
			if (hasAccess) {
				await value.call(this, ctx);
			}
		});
	};
}

export const Scene = (sceneId: string) =>
	function <T extends TConstructor>(constructor: T): T {
		return class extends Scenes.BaseScene {
			private readonly instance;

			constructor(...args: any[]) {
				super(sceneId);
				this.instance = new constructor(...args);

				return new Proxy(this, {
					get(target, prop, receiver) {
						if (prop in target) return Reflect.get(target, prop, receiver);
						return Reflect.get(target.instance, prop, receiver);
					},
					set(target, prop, value, receiver) {
						if (prop in target)
							return Reflect.set(target, prop, value, receiver);
						return Reflect.set(target.instance, prop, value, receiver);
					}
				});
			}
		} as unknown as T;
	};
