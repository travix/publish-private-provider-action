import { disableNetConnect } from "nock/lib/intercept";
import { resolve } from "path";
import { defineConfig } from "vite";

disableNetConnect();

export default defineConfig({
    resolve: {
        alias: {
            lib: resolve(__dirname, "./src/lib")
        }
    },
    test: {
        clearMocks: true,
        coverage: {
            reporter: ["lcov", "html"],
            branches: 70,
            exclude: ["mocks.ts", "**/test-lib/**", "**/__tests__/**", "**/__mocks__/**"],
            excludeNodeModules: true,
            functions: 90,
            lines: 90,
            perFile: true,
            skipFull: true,
            statements: 90
        },
        globals: true,
        include: ["**/*.test.ts", "**/*.test.js"]
    }
});
