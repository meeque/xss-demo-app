import type { Config } from 'jest';
import { createCjsPreset } from 'jest-preset-angular/presets/index.js';

export default {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '[.]integration[.]spec[.]ts$'],
} satisfies Config;
