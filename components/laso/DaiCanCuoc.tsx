'use client';

import { useMemo } from 'react';
import type { LaSo } from '@/lib/tuvi/ansao';
import { cungDaiVan, cungTieuHan } from '@/lib/tuvi/ansao';
import { chiTietDiemTungCung } from '@/lib/rag/v3/du-kien';

/**
 * DẢI CĂN CƯỚC — dữ kiện riêng của lá số, đặt ngay dưới tiêu đề `/la-so`.
 *
 * VÌ SAO CÓ: đo ngày 09/10/2026 ở khổ 390px, màn đầu tiên của `/la-so` chỉ có
 * tiêu đề, ba dòng hướng dẫn và hai nút viền — KHÔNG một dữ kiện nào thuộc về
 * người đang đọc, và không một điểm màu nào. Người dùng phải cuộn qua gần một
 * màn rưỡi mới gặp thứ đầu tiên nói về họ. Đó là chỗ mất người nặng nhất, và
 * cũng là lý do màn này bị chê "trống".
 *
 * Dải này lấp đúng khoảng ấy bằng SÁU dữ kiện engine tính sẵn — không tốn một
 * lượt model nào, nên nó hiện ngay cùng trang chứ không chờ.
 *
 * KHÔNG phải câu luận: dòng "Thuận ở … · Cần chăm chút …" đọc thẳng xếp hạng
 * tất định của `chiTietDiemTungCung`, đúng thứ bản đồ Mạnh–Yếu hiện ở tab bên
 * cạnh. Hai chỗ cùng một nguồn nên không bao giờ lệch nhau.
 *
 * Màu ở đây có việc, không trang trí: xanh và hổ phách là đúng hai màu nhóm
 * của bản đồ Mạnh–Yếu (`--tier-manh`, `--tier-gang`), nên người đọc gặp lại
 * chúng ở tab kia là nhận ra ngay.
 */
export function DaiCanCuoc({ laSo, namXem }: { laSo: LaSo; namXem: number }) {
  const { o, manh, canGang, daiVan, tuoi } = useMemo(() => {
    const t = laSo.thongTin;
    const tuoiAm = namXem - t.amLich.nam + 1;
    const dv = cungDaiVan(laSo, tuoiAm);
    const cungNam = laSo.cungs[cungTieuHan(laSo, tuoiAm)];
    const diem = [...chiTietDiemTungCung(laSo)].sort((a, b) => b.diem - a.diem);

    return {
      tuoi: tuoiAm,
      daiVan: dv?.daiVan ? `${dv.daiVan.tuTuoi}–${dv.daiVan.denTuoi}` : null,
      manh: diem.filter((d) => d.muc === 'Mạnh').slice(0, 3).map((d) => d.linhVuc),
      canGang: diem.filter((d) => d.muc === 'Cần gắng').slice(-2).map((d) => d.linhVuc),
      o: [
        { nhan: 'Mệnh', gia: laSo.cungs[laSo.menhIndex].chi },
        { nhan: 'Cục', gia: laSo.cuc.ten },
        { nhan: 'Bản mệnh', gia: laSo.banMenh.ten },
        { nhan: 'Thân cư', gia: laSo.thanCuCung },
        { nhan: 'Mệnh chủ', gia: laSo.menhChu },
        { nhan: `Cung năm ${namXem}`, gia: cungNam.tenCung },
      ],
    };
  }, [laSo, namXem]);

  return (
    <section className="dcc" aria-label="Dữ kiện lá số">
      <ul className="dcc__o">
        {o.map((x) => (
          <li key={x.nhan}>
            <span className="dcc__nhan">{x.nhan}</span>
            <strong className="dcc__gia">{x.gia}</strong>
          </li>
        ))}
      </ul>

      {(manh.length > 0 || canGang.length > 0) && (
        <p className="dcc__tom">
          {manh.length > 0 && (
            <span className="dcc__ve">
              <span className="dcc__cham" data-huong="thuan" aria-hidden />
              Thuận ở <strong>{manh.join(', ')}</strong>
            </span>
          )}
          {canGang.length > 0 && (
            <span className="dcc__ve">
              <span className="dcc__cham" data-huong="gang" aria-hidden />
              Cần chăm chút ở <strong>{canGang.join(', ')}</strong>
            </span>
          )}
          {daiVan && (
            <span className="dcc__ve dcc__ve--phu">
              Đại vận {daiVan} tuổi · {tuoi} tuổi âm
            </span>
          )}
        </p>
      )}
    </section>
  );
}
