import { UserButtons, UserButtonsText } from './buttons/UserButtons';

export const IGNORE_PATTERNS: readonly string[] = [
	'/start',
	'/help',
	UserButtons.textRefresh.text,
	...Object.values(UserButtonsText)
];
