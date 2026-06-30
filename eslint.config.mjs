// Flat ESLint config. Next.js 16 removed the built-in `next lint` command, so
// linting runs ESLint directly via the "lint" script in package.json.
import next from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "coverage/**", "node_modules/**", "next-env.d.ts"] },
  ...next,
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
