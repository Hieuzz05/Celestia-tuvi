import { Text, View } from 'react-native';
import { Chu } from '@/giao-dien/co-ban';
import { useMau } from '@/thiet-ke/theme';
import { FONT, KHOANG } from '@/thiet-ke/token';

/**
 * Markdown tối giản cho lời của Celes — cùng luật với `components/MarkdownLuanGiai.tsx`
 * của web: đề mục #/##/###, **đậm**, gạch đầu dòng, đoạn văn.
 *
 * Hai luật đã trả giá bên web, giữ nguyên ở đây:
 *   - `###` xét trước `##` — bài dài dùng đề mục cấp ba, thiếu nhánh là lộ "###".
 *   - Dấu thăng còn sót (####…) bị gỡ hết: thà mất một cấp đề mục còn hơn để
 *     người đọc thấy cú pháp thô.
 */
export function Markdown({ noiDung, nho }: { noiDung: string; nho?: boolean }) {
  const mau = useMau();
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

  return (
    <View style={{ gap: KHOANG.x3 }}>
      {dong.map((d, i) => {
        if (d.startsWith('### ')) {
          return (
            <Chu key={i} kieu="h3" style={{ fontSize: nho ? 16 : 18, lineHeight: nho ? 21 : 23, marginTop: KHOANG.x2 }}>
              {dam(d.slice(4))}
            </Chu>
          );
        }
        if (d.startsWith('## ')) {
          return (
            <Chu key={i} kieu="h3" style={{ fontSize: nho ? 18 : 21, marginTop: KHOANG.x3 }}>
              {d.slice(3)}
            </Chu>
          );
        }
        if (d.startsWith('# ')) {
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
