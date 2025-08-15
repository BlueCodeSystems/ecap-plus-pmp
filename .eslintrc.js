module.exports = {
  extends: [
    'react-app',
    'plugin:prettier/recommended',
  ],
  rules: {
    // Optional: You can add your custom rules here
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
