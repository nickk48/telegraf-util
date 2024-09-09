import { Markup } from 'telegraf';

export enum UserButtonsText {
	GET_STICKER = '🎁 Get sticker',
	GET_REPO_LINK = '🔗 Get link on repository'
}

export class UserButtons {
	static readonly textRefresh = Markup.button.text('🂭 Refresh');

	static get generalMenu() {
		return Markup.keyboard([
			UserButtonsText.GET_STICKER,
			this.textRefresh
		]).resize();
	}
}
