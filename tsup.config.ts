import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/styles.css"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  banner: {
    js: '"use client";'
  }
})
