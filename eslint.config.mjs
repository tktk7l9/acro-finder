// Flat ESLint config. Next.js 16 removed the built-in `next lint` command, so
// linting runs ESLint directly via the "lint" script in package.json.
import next from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const config = [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
      // OpenNext / wrangler output. Linting it produces hundreds of errors.
      ".open-next/**",
      ".wrangler/**",
    ],
  },
  ...next,
  {
    settings: {
      // eslint-plugin-react 7.x resolves `version: "detect"` through
      // context.getFilename(), which ESLint 10 removed; pin the major instead.
      react: { version: "19" },
    },
  },
  {
    // eslint-config-next parses plain JS with its bundled @babel/eslint-parser,
    // whose scope manager lacks addGlobals() and crashes under ESLint 10.
    // typescript-eslint's parser supports ESLint 10 and handles JS/JSX too.
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: { parser: tseslint.parser },
  },
  {
    rules: {
      // The react-hooks v6 plugin (bundled with eslint-config-next 16) treats
      // any setState inside an effect as an error. We intentionally use that
      // pattern in DetailPanel / SkillsApp / app/page to hydrate state from
      // localStorage and the URL on mount — doing it in a lazy initializer
      // would cause SSR hydration mismatches. Keep visibility as a warning
      // rather than disabling entirely.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
