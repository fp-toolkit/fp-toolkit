import path from "node:path"
import { defineConfig, coverageConfigDefaults } from "vitest/config"
import packageJson from "./package.json"

const getPackageName = () => {
    return packageJson.name
}

const getPackageNameCamelCase = () => {
    try {
        return getPackageName().replace(/-./g, char => char[1].toUpperCase())
    } catch (err) {
        throw new Error("Name property in package.json is missing.")
    }
}

const fileName = {
    es: `${getPackageName()}.mjs`,
    cjs: `${getPackageName()}.cjs`,
    iife: `${getPackageName()}.iife.js`,
}

const formats = Object.keys(fileName) as Array<keyof typeof fileName>

export default defineConfig({
    base: "./",
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: getPackageNameCamelCase(),
            formats,
            fileName: format => fileName[format],
        },
        emptyOutDir: false,
    },
    test: {
        coverage: {
            exclude: [
                ...coverageConfigDefaults.exclude,
                "commitlint.config.ts",
                "docs",
            ],
        },
    },
})
