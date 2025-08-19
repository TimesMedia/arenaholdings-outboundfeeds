module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
  ignorePatterns: ['data/', 'dist/'],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {},
    ecmaFeatures: {
      jsx: true,
      modules: true,
      legacyDecorators: true,
    },
  },
  plugins: ['react', 'unused-imports', 'simple-import-sort'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    'global-require': 'off',
    'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    'no-case-declarations': 'off',
    'no-underscore-dangle': ['error', { allow: ['_website', '_id'] }],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'unused-imports/no-unused-imports': 'error',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [['^@?\\w'], ['^\\../']],
      },
    ],
  },
};
