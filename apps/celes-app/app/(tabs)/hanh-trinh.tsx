import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, ChonPhanDoan, Eyebrow, Pill, The } from '@/giao-dien/co-ban';
import { MAU_LINH_VUC } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { dien, useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { cungDaiVan, cungNguyetHan, cungTieuHan } from '@tuvi/ansao';

/**
 * Hành trình — thời gian dưới dạng câu chuyện, không phải bảng tra.
 *
 * Nhãn chuyên môn "đại vận / tiểu hạn / nguyệt hạn" KHÔNG xuất hiện ở lớp đầu.
 * Người dùng đọc "giai đoạn bạn đang đi qua", "năm nay", "tháng này"; ai muốn
 * biết tên gọi truyền thống thì mở phần căn cứ.
 */

type Doan = 'tong-quan' | 'nam' | 'thang';

const THANG = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ManHanhTrinh() {
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { laSo } = useHoSo();

  const namNay = new Date().getFullYear();
  const [doan, setDoan] = useState<Doan>('tong-quan');
  const [nam, setNam] = useState(namNay);
  const [thang, setThang] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    ghiSuKien('journey_viewed');
  }, []);

  const tuoiAm = laSo ? nam - laSo.thongTin.amLich.nam + 1 : 0;

  const giaiDoan = useMemo(() => (laSo ? cungDaiVan(laSo, tuoiAm) : undefined), [laSo, tuoiAm]);
  const cungNam = useMemo(
    () => (laSo ? laSo.cungs[cungTieuHan(laSo, tuoiAm)] : undefined),
    [laSo, tuoiAm]
  );
  const cungThang = useMemo(
    () => (laSo ? laSo.cungs[cungNguyetHan(laSo, tuoiAm, thang)] : undefined),
    [laSo, tuoiAm, thang]
  );

  // Dải năm quanh năm đang chọn để lướt qua lại
  const dayNam = useMemo(
    () => Array.from({ length: 9 }, (_, i) => namNay - 2 + i),
    [namNay]
  );

  if (!laSo) {
    return (
      <View style={{ flex: 1, backgroundColor: mau.nen, padding: LE_NGANG, paddingTop: le.top + KHOANG.x10 }}>
        <Chu kieu="body" mo>
          {t.trangThai.rong}
        </Chu>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <View style={{ paddingTop: le.top + KHOANG.x4, paddingHorizontal: LE_NGANG, gap: KHOANG.x4 }}>
        <Chu kieu="h2">{t.hanhTrinh.tieuDe}</Chu>
        <ChonPhanDoan<Doan>
          giaTri={doan}
          onChange={setDoan}
          muc={[
            { gt: 'tong-quan', nhan: t.hanhTrinh.tongQuan },
            { gt: 'nam', nhan: t.hanhTrinh.nam },
            { gt: 'thang', nhan: t.hanhTrinh.thang },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: LE_NGANG,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x5,
        }}
      >
        {doan === 'tong-quan' && giaiDoan?.daiVan && (
          <>
            {/* Trục thời gian các giai đoạn 10 năm, mốc đang đi qua được tô đậm */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>
              {laSo.cungs
                .filter((c) => c.daiVan)
                .sort((a, b) => (a.daiVan!.tuTuoi ?? 0) - (b.daiVan!.tuTuoi ?? 0))
                .map((c) => (
                  <Pill
                    key={c.chiIndex}
                    nhan={`${c.daiVan!.tuTuoi}–${c.daiVan!.denTuoi}`}
                    dangChon={c.chiIndex === giaiDoan.chiIndex}
                  />
                ))}
            </View>

            <The am style={{ gap: KHOANG.x3 }}>
              <Eyebrow mauChu={MAU_LINH_VUC.celes}>
                {dien(t.hanhTrinh.dangO, {
                  tu: giaiDoan.daiVan.tuTuoi,
                  den: giaiDoan.daiVan.denTuoi,
                })}
              </Eyebrow>
              <Chu kieu="h2">{giaiDoan.tenCung}</Chu>
              <Chu kieu="body">
                {giaiDoan.sao
                  .filter((s) => s.loai === 'chinh-tinh')
                  .map((s) => s.ten)
                  .join(' · ') || '—'}
              </Chu>
            </The>
          </>
        )}

        {doan === 'nam' && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: KHOANG.x2 }}
            >
              {dayNam.map((n) => (
                <Pill
                  key={n}
                  nhan={String(n)}
                  dangChon={n === nam}
                  onPress={() => {
                    setNam(n);
                    ghiSuKien('year_selected');
                  }}
                />
              ))}
            </ScrollView>

            {cungNam && (
              <The style={{ gap: KHOANG.x3 }}>
                <Eyebrow>{String(nam)}</Eyebrow>
                <Chu kieu="h3">{cungNam.tenCung}</Chu>
                <Chu kieu="bodySm" mo>
                  {cungNam.sao
                    .filter((s) => s.loai === 'chinh-tinh')
                    .map((s) => s.ten)
                    .join(' · ') || '—'}
                </Chu>
              </The>
            )}
          </>
        )}

        {doan === 'thang' && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: KHOANG.x2 }}
            >
              {THANG.map((m) => (
                <Pill
                  key={m}
                  nhan={`T${m}`}
                  dangChon={m === thang}
                  onPress={() => {
                    setThang(m);
                    ghiSuKien('month_selected');
                  }}
                />
              ))}
            </ScrollView>

            {cungThang && (
              <The style={{ gap: KHOANG.x3 }}>
                <Eyebrow>{`${nam} · T${thang}`}</Eyebrow>
                <Chu kieu="h3">{cungThang.tenCung}</Chu>
                <Chu kieu="bodySm" mo>
                  {cungThang.sao
                    .filter((s) => s.loai === 'chinh-tinh')
                    .map((s) => s.ten)
                    .join(' · ') || '—'}
                </Chu>
              </The>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
