// Test if Browser Rendering is available
export const onRequest: PagesFunction<{ BROWSER: any }> = async (context) => {
	return Response.json({
		hasBrowser: !!context.env.BROWSER,
		envKeys: Object.keys(context.env || {}),
		platform: typeof context.env
	});
};
