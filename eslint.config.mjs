import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
    rules: {
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default config;
