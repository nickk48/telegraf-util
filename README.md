# Util/decorators for telegraf

### Install dependencies

```bash
npm i telegraf-util axios telegraf
```

### Recommendation for tsconfig.json

```json
{
	"compilerOptions": {
		"module": "NodeNext",
		"target": "ES2022",
		"strict": true,
		"alwaysStrict": true,
		"skipLibCheck": true,
		"esModuleInterop": true,
		"noImplicitThis": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"strictNullChecks": true,
		"noImplicitAny": true,
		"forceConsistentCasingInFileNames": true,
		"strictFunctionTypes": true,
		"strictPropertyInitialization": true,
		"exactOptionalPropertyTypes": true,
		"noImplicitReturns": true,
		"rootDir": "./src",
		"outDir": "./dist"
	}
}
```

### Work with scenes

```typescript
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
```

### Work with guards

```typescript
import { Context } from 'telegraf';
import { Command, Guard, IGuard } from 'telegraf-util';

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

export class UserHandler {
	@Command('posts')
	@Guard(HaveUsernameGuard)
	findPosts() {}
}
```

### Bootstrap

```typescript
async function main() {
	const bot = new Telegraf(process.env.TOKEN as string);
	const handlers = provideHandlers();

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
```
