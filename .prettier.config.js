module.exports = {
    parser: 'typescript',
    trailingComma: 'es5',
    singleQuote: true,
    overrides: [
      {
        files: ['*.json'],
        options: { parser: 'json' },
      },
    ],
  };

