/**
 * Soi xem đăng nhập Google đã bật tới đâu.
 *
 * Nút "Tiếp tục với Google" chỉ hiện khi Supabase báo provider google đang bật,
 * nên khi không thấy nút thì chạy lệnh này để biết còn thiếu bước nào thay vì
 * mò trong dashboard.
 *
 * Chạy: npm run kiem-tra-sso
 */

import { readFileSync } from 'node:fs';

const DU_AN = 'wqhxksgtkyoqknicombi';

function docEnv() {
  for (const ten of ['.env.local', '.env']) {
    try {
      const noiDung = readFileSync(new URL(`../${ten}`, import.meta.url), 'utf8');
      const lay = (khoa) =>
        noiDung
          .split('\n')
          .find((d) => d.startsWith(`${khoa}=`))
          ?.slice(khoa.length + 1)
          .trim();
      const url = lay('NEXT_PUBLIC_SUPABASE_URL');
      const key = lay('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      if (url && key) return { url, key, ten };
    } catch {
      // thử tệp kế tiếp
    }
  }
  return null;
}

const env = docEnv();
if (!env) {
  console.log('✗ Không đọc được NEXT_PUBLIC_SUPABASE_URL / ANON_KEY trong .env.local');
  process.exit(1);
}

const res = await fetch(`${env.url}/auth/v1/settings`, { headers: { apikey: env.key } });
if (!res.ok) {
  console.log(`✗ Supabase trả lỗi HTTP ${res.status} — kiểm tra lại URL và anon key trong ${env.ten}`);
  process.exit(1);
}

const cauHinh = await res.json();
const duAn = new URL(env.url).hostname.split('.')[0];
const google = cauHinh.external?.google === true;
const dangBat = Object.entries(cauHinh.external ?? {})
  .filter(([, v]) => v === true)
  .map(([k]) => k);

console.log(`Project Supabase: ${duAn}`);
console.log(`Provider đang bật: ${dangBat.join(', ') || '(không có)'}`);
console.log('');

if (google) {
  console.log('✓ Google đã bật. Mở /dang-nhap là thấy nút "Tiếp tục với Google".');
  console.log('  Nếu bấm vào mà lỗi, xem bảng tra lỗi ở mục 3.2 trong HUONG-DAN.md.');
  process.exit(0);
}

console.log('✗ Google CHƯA bật — vì vậy nút SSO không hiện trên trang đăng nhập.');
console.log('');
console.log('Còn phải làm:');
console.log('');
console.log('  1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID');
console.log('     https://console.cloud.google.com/apis/credentials');
console.log('     Application type: Web application');
console.log('     Authorized redirect URIs điền ĐÚNG một dòng này:');
console.log(`       https://${duAn}.supabase.co/auth/v1/callback`);
console.log('     → bấm Create, copy Client ID và Client Secret');
console.log('');
console.log('  2. Supabase → Authentication → Providers → Google → bật, dán 2 giá trị trên → Save');
console.log(`     https://supabase.com/dashboard/project/${duAn}/auth/providers`);
console.log('');
console.log('  3. Supabase → Authentication → URL Configuration');
console.log(`     https://supabase.com/dashboard/project/${duAn}/auth/url-configuration`);
console.log('     Site URL: https://celestia-tuvi.vercel.app');
console.log('     Redirect URLs thêm 2 dòng:');
console.log('       https://celestia-tuvi.vercel.app/auth/callback');
console.log('       http://localhost:3000/auth/callback');
console.log('');
if (duAn !== DU_AN) {
  console.log(`  Lưu ý: project đang dùng (${duAn}) khác với project ghi trong hướng dẫn (${DU_AN}).`);
  console.log('  Hãy chắc bạn bật Google đúng ở project này.');
  console.log('');
}
console.log('Làm xong chạy lại lệnh này để xác nhận.');
process.exit(1);
