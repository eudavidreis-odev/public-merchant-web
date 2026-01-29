module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
    collectCoverageFrom: [
        'services/**/*.{ts,tsx}',
        'contexts/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
};
