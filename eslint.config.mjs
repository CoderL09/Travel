import withNuxt from './.nuxt/eslint.config.mjs';
import prettier from 'eslint-config-prettier';

export default withNuxt(
  {
    ignores: [
      '.output',
      '.data',
      '.nitro',
      '.cache',
      'dist',
      'app/generated',
      'playwright-report',
      'test-results',
      'coverage',
      'prisma/migrations'
    ]
  },
  prettier
);
