'use client';

import { useState } from 'react';
import { NutChinh, NutVien, O, OChon, Truong } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { hourToChi } from '@/lib/tuvi/lunar';
import { CHI } from '@/lib/tuvi/constants';
import type { GioiTinh } from '@/lib/tuvi/ansao';

/**
 * Nhập thông tin sinh theo từng bước ngắn.
 *
 * Trước đây tất cả ô nằm chung một thẻ, trông như một form tiện ích — người mới
 * nhìn vào thấy phải khai báo cả năm xem, tháng xem lẫn model AI trước khi nhận
 * được gì. Chia nhỏ ra ba bước làm mỗi màn chỉ hỏi đúng một việc, và những thứ
 * không cần cho lần đọc đầu thì chuyển hẳn đi chỗ khác.
 */

export interface ThongTinSinhForm {
  hoTen: string;
  ngaySinh: string;
  /** Giờ trong ngày 0-23 */
  gio: number;
  phut: number;
  gioiTinh: GioiTinh;
}

export const MAC_DINH: ThongTinSinhForm = {
  hoTen: '',
  ngaySinh: '',
  gio: 9,
  phut: 0,
  gioiTinh: 'nam',
};

const TONG_BUOC = 3;

export function BuocNhapSinh({
  giaTriDau = MAC_DINH,
  onXong,
}: {
  giaTriDau?: ThongTinSinhForm;
  onXong: (v: ThongTinSinhForm) => void;
}) {
  const [buoc, setBuoc] = useState(1);
  const [form, setForm] = useState<ThongTinSinhForm>(giaTriDau);
  const [hienGiaiThichGio, setHienGiaiThichGio] = useState(false);

  const set = <K extends keyof ThongTinSinhForm>(k: K, v: ThongTinSinhForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const ngayHopLe = /^\d{4}-\d{2}-\d{2}$/.test(form.ngaySinh) && !Number.isNaN(Date.parse(form.ngaySinh));

  const tien = () => {
    if (buoc === 1) ghiSuKien('birth_flow_started');
    if (buoc < TONG_BUOC) {
      setBuoc((b) => b + 1);
      return;
    }
    onXong(form);
  };

  const gioChi = CHI[hourToChi(form.gio)];

  return (
    <div className="card mx-auto flex w-full max-w-[560px] flex-col gap-[24px]">
      {/* Chỉ báo tiến độ — cho biết còn bao xa, giảm cảm giác form dài vô tận */}
      <div className="flex flex-col gap-[8px]">
        <span className="eyebrow">
          Bước {buoc} / {TONG_BUOC}
        </span>
        <div className="flex gap-[4px]" aria-hidden>
          {Array.from({ length: TONG_BUOC }, (_, i) => (
            <span
              key={i}
              className="h-[3px] flex-1 rounded-full"
              style={{ background: i < buoc ? 'var(--fg)' : 'var(--line)' }}
            />
          ))}
        </div>
      </div>

      {buoc === 1 && (
        <div className="flex flex-col gap-[16px]">
          <h1 className="heading-sm">Bạn sinh ngày nào?</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Nhập theo dương lịch — đúng như trên giấy khai sinh. Celestia tự quy đổi phần âm lịch.
          </p>
          <Truong nhan="Ngày sinh (dương lịch)">
            <O
              type="date"
              value={form.ngaySinh}
              onChange={(e) => set('ngaySinh', e.target.value)}
              autoFocus
            />
          </Truong>
        </div>
      )}

      {buoc === 2 && (
        <div className="flex flex-col gap-[16px]">
          <h1 className="heading-sm">Bạn sinh khoảng mấy giờ?</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Giờ sinh quyết định phần lớn lá số, nên càng sát càng tốt. Nhớ tương đối cũng dùng được.
          </p>

          <div className="grid grid-cols-2 gap-[16px]">
            <Truong nhan="Giờ">
              <OChon value={form.gio} onChange={(e) => set('gio', Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')} giờ
                  </option>
                ))}
              </OChon>
            </Truong>
            <Truong nhan="Phút">
              <OChon value={form.phut} onChange={(e) => set('phut', Number(e.target.value))}>
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')} phút
                  </option>
                ))}
              </OChon>
            </Truong>
          </div>

          <p className="body-sm" style={{ color: 'var(--fg)' }}>
            Khớp với <b>giờ {gioChi}</b> trong lá số.
          </p>

          <button
            type="button"
            onClick={() => setHienGiaiThichGio((v) => !v)}
            className="link-text self-start"
            aria-expanded={hienGiaiThichGio}
          >
            Tôi không nhớ giờ sinh
          </button>

          {hienGiaiThichGio && (
            <div
              className="flex flex-col gap-[8px] pt-[12px]"
              style={{ borderTop: '1px solid var(--line)' }}
            >
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                Không có giờ sinh thì cung Mệnh không xác định được, mà gần như mọi thứ còn lại đều
                đọc từ đó. Celestia sẽ không đoán bừa một giờ rồi đưa cho bạn kết quả trông như thật.
              </p>
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                Chỗ thường tìm được: giấy chứng sinh của bệnh viện, sổ hộ tịch bản gốc, hoặc hỏi lại
                người nhà. Nếu chỉ nhớ áng chừng buổi (sáng sớm, trưa, chiều tối), cứ chọn giờ gần
                nhất rồi thử vài giờ lân cận để so — phần nào đổi theo giờ thì bạn sẽ thấy ngay.
              </p>
            </div>
          )}
        </div>
      )}

      {buoc === 3 && (
        <div className="flex flex-col gap-[16px]">
          <h1 className="heading-sm">Vậy là đủ rồi</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Còn một thông tin nữa ảnh hưởng tới cách tính, và một chỗ để bạn dễ nhận ra lá số này về
            sau.
          </p>

          <Truong
            nhan="Giới tính"
            goiY="Cách tính truyền thống chia theo hai nhóm để xác định chiều đi của các giai đoạn."
          >
            <OChon
              value={form.gioiTinh}
              onChange={(e) => set('gioiTinh', e.target.value as GioiTinh)}
            >
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </OChon>
          </Truong>

          <Truong nhan="Tên gọi (không bắt buộc)" goiY="Chỉ dùng để bạn phân biệt khi lưu nhiều lá số.">
            <O
              value={form.hoTen}
              onChange={(e) => set('hoTen', e.target.value)}
              placeholder="VD: Mình, Mẹ, Anh Nam"
            />
          </Truong>
        </div>
      )}

      <div className="flex items-center gap-[12px]">
        {buoc > 1 && (
          <NutVien nho onClick={() => setBuoc((b) => b - 1)}>
            Quay lại
          </NutVien>
        )}
        <NutChinh onClick={tien} disabled={buoc === 1 && !ngayHopLe} className="ml-auto">
          {buoc < TONG_BUOC ? 'Tiếp tục' : 'Xem góc nhìn của tôi'}
        </NutChinh>
      </div>
    </div>
  );
}
