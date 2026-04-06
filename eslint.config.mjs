import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
	...tseslint.configs.recommended,
	{
		rules: {
			semi: "error",
			"prefer-const": "error",
			"no-param-reassign": ["error", { "props": true }],
			"prefer-destructuring": ["error"],
			"max-len": ["error", {
				"code": 100,
				tabWidth: 4,
				ignoreRegExpLiterals: true,
				ignorePattern: "^(?:(import\\s.+\\sfrom\\s.+;)|(\\s*`[^`]*`))$",
			}],
		},
		files: ["src/**/*.{ts,tsx}"],
	},
]);