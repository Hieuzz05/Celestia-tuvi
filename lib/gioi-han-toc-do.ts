/**
 * Chặn một máy gọi dồn dập vào các route tốn model.
 *
 * Hạn mức theo ngày (lib/support/quota*.ts, lib/auth/gioi-han-khach.ts) mới là
 * hàng rào chính về chi phí; lớp này chỉ chặn loạt gọi dồn trong vài giây — kịch
 * bản bấm liên tục, script lặp, hay tab mở lại vòng vòng — trước khi chúng kịp
 * đốt hạn mức free tier của nhà cung cấp.
 *
 * Bộ đếm nằm trong bộ nhớ của MỘT instance (ngân sách = 0, không có Redis): hai
 * instance đếm riêng, nên đây là giới hạn mềm chứ không phải tuyệt đối. Đủ cho mục
 * đích trên vì Vercel giữ instance ấm và dồn request cùng nguồn vào đó.
 */

const CUA_SO_MS = 60_000;
/** Một lần mở trang luận giải bắn ~2–6 lượt; 40/phút là thừa cho người thật */
const TOI_DA = 40;
const TRAN_BO_NHO = 5_000;

/** Tiền tố route gọi model — thêm route AI mới thì thêm vào đây */
const ROUTE_TON_MODEL = [
  '/api/hoi-dap',
  '/api/luan-giai',
  '/api/ban-doc-sau',
  '/api/luan-han',
  '/api/diem-noi-bat',
  '/api/moc',
  '/api/nhip',
  '/api/hop-tuoi',
];

const dem = new Map<string, number[]>();

export function laRouteTonModel(duongDan: string): boolean {
  return ROUTE_TON_MODEL.some((p) => duongDan === p || duongDan.startsWith(p + '/') || duongDan.startsWith(p + '-'));
}

/** Ghi một lượt gọi; trả số giây phải chờ nếu vượt, hoặc 0 nếu được đi */
export function ghiLuotGoi(khoa: string, bayGio = Date.now()): number {
  const moc = bayGio - CUA_SO_MS;
  const ds = (dem.get(khoa) ?? []).filter((t) => t > moc);
  if (ds.length >= TOI_DA) {
    dem.set(khoa, ds);
    return Math.max(1, Math.ceil((ds[0] + CUA_SO_MS - bayGio) / 1000));
  }
  ds.push(bayGio);
  dem.delete(khoa); // đưa xuống cuối để xoá theo thứ tự lâu không dùng
  dem.set(khoa, ds);
  if (dem.size > TRAN_BO_NHO) dem.delete(dem.keys().next().value!);
  return 0;
}
