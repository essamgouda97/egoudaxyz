import cloudflareAdapter from "@sveltejs/adapter-cloudflare";
import nodeAdapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";

const useNodeAdapter = process.env.BUILD_ADAPTER === "node";

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
  extensions: [".md"],
  remarkPlugins: [],
  rehypePlugins: [],
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],

  kit: {
    adapter: useNodeAdapter
      ? nodeAdapter({ out: "build" })
      : cloudflareAdapter({
          routes: {
            include: ["/*"],
            exclude: ["<all>"],
          },
        }),
    alias: {
      $convex: "./src/convex",
    },
  },

  extensions: [".svelte", ".md"],
};

export default config;
