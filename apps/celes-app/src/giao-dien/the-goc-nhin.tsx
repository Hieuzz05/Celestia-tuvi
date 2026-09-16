import { useState } from 'react';
import { View } from 'react-native';
import type { GocNhin } from '@tuvi/quick-read';
import { Chu, Eyebrow, The } from '@/giao-dien/co-ban';
import { BangViSao, LienKetViSao } from '@/giao-dien/vi-sao';
import { KHOANG } from '@/thiet-ke/token';

/**
 * Thẻ một góc nhìn, kèm lối mở căn cứ.
 *
 * Dùng lại ở Quick Read, Hôm nay và Bản đồ — cùng một thẻ nên người dùng học
 * một lần là nhận ra ở mọi nơi.
 */
export function TheGocNhin({
  gocNhin,
  noiBat,
  mauNhan,
}: {
  gocNhin: GocNhin;
  /** Thẻ dẫn đầu: tiêu đề lớn hơn, bề mặt ấm */
  noiBat?: boolean;
  mauNhan?: string;
}) {
  const [moViSao, setMoViSao] = useState(false);

  return (
    <>
      <The am={noiBat} style={{ gap: KHOANG.x3 }}>
        <Eyebrow mauChu={mauNhan}>{gocNhin.nhomChu}</Eyebrow>

        <Chu kieu={noiBat ? 'h2' : 'h3'}>{gocNhin.tieuDe}</Chu>

        <Chu kieu={noiBat ? 'bodyLg' : 'body'} mo={!noiBat}>
          {gocNhin.noiDung}
        </Chu>

        <View style={{ marginTop: -KHOANG.x2 }}>
          <LienKetViSao onPress={() => setMoViSao(true)} />
        </View>
      </The>

      <BangViSao
        hienThi={moViSao}
        onDong={() => setMoViSao(false)}
        canCu={gocNhin.canCu}
        tomTat={gocNhin.noiDung}
      />
    </>
  );
}
