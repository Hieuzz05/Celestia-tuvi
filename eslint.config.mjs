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
    // lỗi có sẵn (`MOC` trong scripts/dem-loi-lint.mjs) dùng để phát hiện lỗi mới.
    "apps/",
    // Worktree con và thư mục tạm nằm ngay trong thư mục chính của máy làm việc:
    // mỗi worktree là một bản sao cả kho, quét vào là lint chạy gấp mấy lần và
    // đếm trùng lỗi. CI không có các thư mục này.
    "wt-*/",
    "tmp-*/",
  ]),
]);

export default eslintConfig;
