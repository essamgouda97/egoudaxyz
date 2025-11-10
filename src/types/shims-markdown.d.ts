/* Minimal type shims for libraries without bundled TypeScript declarations.
   These prevent TS7016 errors while allowing the app to compile.
   If you later add proper types, remove these shims. */

declare module "markdown-it" {
  const MarkdownIt: any;
  export default MarkdownIt;
}

declare module "markdown-it-katex" {
  const markdownItKatex: any;
  export default markdownItKatex;
}

declare module "highlight.js" {
  const hljs: any;
  export default hljs;
}
