module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"prettier",
		"plugin:prettier/recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript"
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "C:/Repos/TypeScriptCreeps/tsconfig.json",
		sourceType: "module",
		ecmaVersion: "latest",
	},
	plugins: ["@typescript-eslint", "import"],
	settings: {
		"import/parsers": {
			"@typescript-eslint/parser": [".ts", ".tsx"]
		},
		"import/resolver": {
			typescript: {}
		}
	},
	rules: {
		"@typescript-eslint/array-type": "error",
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/consistent-type-assertions": "error",
		"@typescript-eslint/consistent-type-definitions": "error",
		"@typescript-eslint/explicit-function-return-type": "error",
		"@typescript-eslint/explicit-member-accessibility": [
			"error",
			{
				accessibility: "explicit"
			}
		],
		"@typescript-eslint/no-explicit-any": "error",
		"@typescript-eslint/no-inferrable-types": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-parameter-properties": "error",
		"@typescript-eslint/no-shadow": [
			"error",
			{
				hoist: "all"
			}
		],
		"@typescript-eslint/no-unused-expressions": "error",
		"@typescript-eslint/no-use-before-define": ["error", { functions: false }],
		"@typescript-eslint/prefer-for-of": "error",
		"@typescript-eslint/restrict-template-expressions": "off",
		"@typescript-eslint/space-within-parens": ["off", "never"],
		"@typescript-eslint/unified-signatures": "error",
		"arrow-parens": ["off", "as-needed"],
		"camelcase": "off",
		"complexity": "off",
		"dot-notation": "error",
		"eol-last": "error",
		"eqeqeq": ["error", "smart"],
		"guard-for-in": "off",
		"id-blacklist": ["error", "any", "Number", "number", "String", "string", "Boolean", "boolean", "Undefined"],
		"id-match": "error",
		"linebreak-style": "off",
		"max-classes-per-file": ["error", 1],
		"new-parens": "error",
		"newline-per-chained-call": "error",
		"no-bitwise": "off",
		"no-caller": "error",
		"no-cond-assign": "error",
		"no-console": "off",
		"no-constant-condition": "off",
		"no-debugger": "off",
		"no-eval": "error",
		"no-invalid-this": "error",
		"no-multiple-empty-lines": "error",
		"no-new-wrappers": "error",
		"no-shadow": "off",
		"no-throw-literal": "error",
		"no-trailing-spaces": "error",
		"no-undef-init": "error",
		"no-underscore-dangle": "off",
		"no-var": "error",
		"object-curly-newline": "error",
		"object-shorthand": "error",
		"one-var": ["error", "never"],
		"prefer-spread": "off",
		"prettier/prettier": "off",
		"quote-props": "off",
		"radix": "error",
		"sort-imports": "error",
		"spaced-comment": "error",
	}
};
