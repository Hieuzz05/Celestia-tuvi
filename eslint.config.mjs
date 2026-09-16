import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // App di động có bộ quy tắc riêng (React Native, không có DOM). Để ESLint
    // của web quét sang đó chỉ sinh ra lỗi giả và làm mất tác dụng của mốc
    // "đang có sẵn 9 lỗi" dùng để phát hiện lỗi mới.
    "apps/**",
  ]),
]);

export default eslintConfig;
