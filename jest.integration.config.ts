import type { Config } from 'jest';
import { createCjsPreset } from 'jest-preset-angular/presets';

export default {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-jest.integration.ts'],
  testMatch: ['**/*.integration.spec.ts'],
} satisfies Config;
