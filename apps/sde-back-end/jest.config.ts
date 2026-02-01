export default {
  displayName: 'sde-back-end',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/sde-back-end',
  moduleNameMapper: {
    '^@sde-challenge/shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
  },
};
