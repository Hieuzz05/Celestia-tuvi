import { Text, View } from 'react-native';
import { Chu, Giong } from '@/giao-dien/co-ban';
import { useMau, useVung } from '@/thiet-ke/theme';
import { FONT, KHOANG } from '@/thiet-ke/token';

/**
 * Markdown tối giản cho lời của Celes — cùng luật với `components/MarkdownLuanGiai.tsx`
 * của web: đề mục #/##/###, **đậm**, gạch đầu dòng, đoạn văn.
 *
 * Hai luật đã trả giá bên web, giữ nguyên ở đây:
 *   - `###` xét trước `##` — bài dài dùng đề mục cấp ba, thiếu nhánh là lộ "###".
 *   - Dấu thăng còn sót (####…) bị gỡ hết: thà mất một cấp đề mục còn hơn để
 *     người đọc thấy cú pháp thô.
 *
 * `giong` (bong trò chuyện của Celes, Aurora bản 8): câu mở đầu NGẮN được đọc bằng
 * giọng Celes (Newsreader nghiêng), đề mục thành nhãn nhỏ màu vùng Celes thay vì
 * tiêu đề to — trong một bong chat, tiêu đề cỡ bài viết là quá tay. Câu mở đầu dài
 * thì giữ chữ thân: chữ nghiêng cả đoạn dài rất khó đọc.
 */
const DAI_TOI_DA_CAU_GIONG = 90;

export function Markdown({ noiDung, nho, giong }: { noiDung: string; nho?: boolean; giong?: boolean }) {
  const mau = useMau();
  const vCeles = useVung('celes');
  const dong = noiDung.split('\n').filter((d) => d.trim());
  const kieu = nho ? 'bodySm' : 'body';

  const dam = (s: string) =>
    s.split(/\*\*(.+?)\*\*/g).map((phan, j) =>
      j % 2 === 1 ? (
        <Text key={j} style={{ fontFamily: FONT.thanDam, color: mau.chu }}>
          {phan}
        </Text>
      ) : (
        phan
      )
    );

  const laDoanThuong = (d: string) => !/^#{1,6}\s/.test(d) && !/^[-*]\s/.test(d) && !/^-{3,}$/.test(d.trim());

  const nhanNho = (i: number, s: string) => (
    <Text
      key={i}
      style={{ fontFamily: FONT.thanDam, fontSize: 14, lineHeight: 19, color: vCeles.mau, marginTop: KHOANG.x1 }}
    >
      {s.replace(/\*\*/g, '')}
    </Text>
  );

  return (
    <View style={{ gap: giong ? KHOANG.x2 : KHOANG.x3 }}>
      {dong.map((d, i) => {
        if (giong && i === 0 && laDoanThuong(d)) {
          const tron = d.replace(/\*\*/g, '').trim();
          if (tron.length <= DAI_TOI_DA_CAU_GIONG) {
            return (
              <Giong key={i} co={20} style={{ lineHeight: 25 }}>
                {tron}
              </Giong>
            );
          }
        }
        if (d.startsWith('### ')) {
          if (giong) return nhanNho(i, d.slice(4));
          return (
            <Chu key={i} kieu="h3" style={{ fontSize: nho ? 16 : 18, lineHeight: nho ? 21 : 23, marginTop: KHOANG.x2 }}>
              {dam(d.slice(4))}
            </Chu>
          );
        }
        if (d.startsWith('## ')) {
          if (giong) return nhanNho(i, d.slice(3));
          return (
            <Chu key={i} kieu="h3" style={{ fontSize: nho ? 18 : 21, marginTop: KHOANG.x3 }}>
              {d.slice(3)}
            </Chu>
          );
        }
        if (d.startsWith('# ')) {
          if (giong) return nhanNho(i, d.slice(2));
          return (
            <Chu key={i} kieu="h2" style={{ marginTop: KHOANG.x4 }}>
              {d.slice(2)}
            </Chu>
          );
        }
        if (/^-{3,}$/.test(d.trim())) return null;
        if (/^[-*]\s/.test(d)) {
          return (
            <View key={i} style={{ flexDirection: 'row', gap: KHOANG.x2, paddingLeft: KHOANG.x2 }}>
              <Chu kieu={kieu}>•</Chu>
              <Chu kieu={kieu} style={{ flex: 1 }}>
                {dam(d.replace(/^[-*]\s/, ''))}
              </Chu>
            </View>
          );
        }
        return (
          <Chu key={i} kieu={kieu}>
            {dam(d.replace(/^#{1,6}\s+/, ''))}
          </Chu>
        );
      })}
    </View>
  );
}
