import { Context } from 'telegraf';
import { IGuard } from 'telegraf-util';

export class HaveUsernameGuard implements IGuard {
	handle(ctx: Context): boolean {
		if (ctx.from) {
			return 'username' in ctx.from;
		}

		return false;
	}

	get name(): string {
		return HaveUsernameGuard.name;
	}
}
