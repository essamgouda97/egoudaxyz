import devtoolsJson from "vite-plugin-devtools-json";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

function blogHmr() {
	return {
		name: "blog-hmr",
		handleHotUpdate({ file, server }: { file: string; server: any }) {
			if (file.includes("/src/lib/blog/") && file.endsWith(".md")) {
				server.ws.send({ type: "full-reload" });
				return [];
			}
		}
	};
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		blogHmr()
	],
	build: {
		chunkSizeWarningLimit: 700
	}
});
