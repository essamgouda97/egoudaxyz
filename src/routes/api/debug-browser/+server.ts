import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	return json({
		hasPlatform: !!platform,
		hasEnv: !!platform?.env,
		hasBrowser: !!platform?.env?.BROWSER,
		envKeys: platform?.env ? Object.keys(platform.env) : []
	});
};
