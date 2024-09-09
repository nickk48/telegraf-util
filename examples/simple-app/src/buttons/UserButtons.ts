import { Markup } from 'telegraf';

export enum UserButtonText {
	GET_STICKER = '🎁 Get sticker',
	GET_REPO_LINK = '🔗 Get link on repository',
	SCENE = '☑️ Check scene'
}

export class UserButtons {
	static readonly textRefresh = Markup.button.text('🂭 Refresh');

	static get generalMenu() {
		return Markup.keyboard(
			[...Object.values(UserButtonText), this.textRefresh],
			{
				columns: 2
			}
		).resize();
	}
}
