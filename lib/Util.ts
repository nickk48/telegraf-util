import { Context, Scenes, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { MetaKey } from './constants';
import {
	IGuard,
	TConstructor,
	TContext,
	TCreateTelegrafHandlerConfig,
	TEventName,
	THandlerType,
	TMethod,
	TTriggers
} from './types';

export class Util {
	static addMethodNames<T extends object>(
		target: T,
		key: keyof typeof MetaKey,
		methodName: string
	): void {
		const metaKey = MetaKey[key];
		const enterNames = <string[] | undefined>Reflect.get(target, metaKey);

		if (!enterNames) {
			return void Reflect.set(target, metaKey, [methodName]);
		}

		enterNames.push(methodName);
	}

	static async useGuards<T extends object>(
		target: T,
		ctx: Context,
		methodName: string
	) {
		const guards = Reflect.get(target, MetaKey.GUARDS) as
			| Record<string, IGuard[]>
			| undefined;

		if (!guards) return true;

		const methodGuards = guards[methodName];
		if (!methodGuards) return true;

		for (const guard of methodGuards) {
			const hasAccess = await guard.handle.call(guard, ctx);
			if (!hasAccess) return false;
		}

		return true;
	}

	static createTelegrafHandler<T extends object>(
		this: T,
		{ type, value, pattern, telegraf, eventNames }: TCreateTelegrafHandlerConfig
	) {
		const isEventType = type === 'event';

		const handler = async (ctx: Context) => {
			const hasAccess = await Util.useGuards<T>(this, ctx, value.name);
			if (hasAccess) {
				await value.call(this, ctx);
			}
		};

		if (this instanceof Scenes.BaseScene)
			if (!isEventType) {
				return (<Scenes.BaseScene>this)[type](pattern!, handler);
			} else {
				return (<Scenes.BaseScene>this).on(message(...eventNames!), handler);
			}

		if (!isEventType) {
			return telegraf[type](pattern!, handler);
		}

		return telegraf.on(message(...eventNames!), handler);
	}

	static createListenerDecorator(
		type: THandlerType,
		key: keyof typeof MetaKey,
		pattern?: TTriggers<any> | null,
		eventNames?: TEventName[]
	) {
		return <T extends TMethod>(value: T, context: TContext): TMethod => {
			context.addInitializer(function (this: TConstructor) {
				Util.addMethodNames(this, key, <string>context.name);
			});

			return function (this: TConstructor, telegraf: Telegraf) {
				Util.createTelegrafHandler.call(this, {
					type,
					telegraf,
					value,
					pattern,
					eventNames
				});
			};
		};
	}
}
