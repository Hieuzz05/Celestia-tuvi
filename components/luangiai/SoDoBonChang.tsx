'use client';

import {
  CHANG,
  CHANG_CUA_MUC,
  CUNG_CUA_MUC,
  GUONG,
  MUC_CUA_CUNG,
  THU_TU_CHANG,
  type MucId,
} from '@/lib/tuvi/chang-cung';
import { CHU_12_CUNG } from '@/lib/tuvi/chu-12-cung';

/**
 * SƠ ĐỒ "BỐN CHẶNG, MƯỜI HAI TẤM GƯƠNG".
 *
 * ---------------------------------------------------------------------------
 * SƠ ĐỒ NÀY LÀ LẬP LUẬN, KHÔNG PHẢI TRANG TRÍ
 *
 * Nó tồn tại để trả lời một câu hỏi mà chữ không trả lời gọn được: vì sao bài
 * đọc này không phải mười hai bài rời ghép lại. Sáu đường nét đứt cho thấy mỗi
 * phần được soi bằng một phần khác, và bốn trong sáu đường ấy BẮC CẦU sang
 * chặng khác — nên không đọc tuyến tính được.
 *
 * Vẽ bằng SVG chứ không bằng ảnh: nó phải đổi màu theo phần đang đọc, phải bấm
 * được để nhảy, và phải đọc được ở cả hai chế độ sáng tối.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO GOM ĐƯỜNG THÀNH CẶP
 *
 * Gương là quan hệ HAI CHIỀU: Mệnh soi qua Thiên Di thì Thiên Di cũng soi qua
 * Mệnh. Vẽ mười hai đường là vẽ mỗi quan hệ hai lần, và hình rối tới mức không
 * ai đọc ra điều gì. Gom lại còn sáu — đúng số quan hệ thật.
 */

const RONG = 260;
const CAO = 300;
const COT = 4;
const HANG = 3;
const O_RONG = 52;
const O_CAO = 34;

function viTri(muc: MucId): { x: number; y: number } {
  const chang = CHANG_CUA_MUC[muc];
  const cot = THU_TU_CHANG.indexOf(chang);
  const hang = CHANG[chang].muc.indexOf(muc);
  const buocX = (RONG - O_RONG) / (COT - 1);
  const buocY = (CAO - O_CAO - 40) / (HANG - 1);
  return { x: cot * buocX, y: 40 + hang * buocY };
}

/** Sáu cặp gương, mỗi quan hệ đúng một lần */
function capGuong(): [MucId, MucId][] {
  const daCo = new Set<string>();
  const ra: [MucId, MucId][] = [];
  for (const muc of Object.keys(CUNG_CUA_MUC) as MucId[]) {
    const doi = MUC_CUA_CUNG[GUONG[CUNG_CUA_MUC[muc]]];
    if (!doi) continue;
    const khoa = [muc, doi].sort().join('|');
    if (daCo.has(khoa)) continue;
    daCo.add(khoa);
    ra.push([muc, doi]);
  }
  return ra;
}

export function SoDoBonChang({
  dangDoc,
  onChon,
}: {
  dangDoc?: MucId | null;
  onChon?: (muc: MucId) => void;
}) {
  const cap = capGuong();
  const mucGuong = dangDoc ? MUC_CUA_CUNG[GUONG[CUNG_CUA_MUC[dangDoc]]] : null;

  return (
    <figure className="flex flex-col gap-[10px]">
      <figcaption className="eyebrow">Bốn chặng, mười hai tấm gương</figcaption>

      <svg
        viewBox={`-6 0 ${RONG + 12} ${CAO}`}
        className="w-full"
        role="img"
        aria-label="Sơ đồ bốn chặng và mười hai tấm gương: mỗi phần được soi bằng một phần khác"
      >
        {/* Tên bốn chặng */}
        {THU_TU_CHANG.map((c, i) => {
          const { x } = viTri(CHANG[c].muc[0]);
          return (
            <text
              key={c}
              x={x + O_RONG / 2}
              y={16}
              textAnchor="middle"
              style={{ fontSize: 9, fill: 'var(--fg-muted)' }}
            >
              {i + 1}
            </text>
          );
        })}

        {/*
          Đường gương vẽ TRƯỚC ô, để ô nằm đè lên đầu đường.
          Nét đứt: đây là quan hệ soi chiếu, không phải luồng đi.
        */}
        {cap.map(([a, b]) => {
          const pa = viTri(a);
          const pb = viTri(b);
          const cungChang = CHANG_CUA_MUC[a] === CHANG_CUA_MUC[b];
          const sang = dangDoc === a || dangDoc === b;
          const x1 = pa.x + O_RONG / 2;
          const y1 = pa.y + O_CAO / 2;
          const x2 = pb.x + O_RONG / 2;
          const y2 = pb.y + O_CAO / 2;
          // Gương nội bộ cùng chặng: vẽ cong ra ngoài, nếu không hai ô cạnh
          // nhau nối bằng đường thẳng sẽ lẫn vào viền ô
          const d = cungChang
            ? `M ${x1} ${y1} C ${x1 - 26} ${(y1 + y2) / 2}, ${x2 - 26} ${(y1 + y2) / 2}, ${x2} ${y2}`
            : `M ${x1} ${y1} L ${x2} ${y2}`;
          return (
            <path
              key={`${a}|${b}`}
              d={d}
              fill="none"
              stroke={sang ? '#DF37A7' : 'var(--line)'}
              strokeWidth={sang ? 1.6 : 1}
              strokeDasharray="3 3"
              opacity={sang ? 1 : 0.55}
            />
          );
        })}

        {/* Mười hai ô */}
        {(Object.keys(CUNG_CUA_MUC) as MucId[]).map((m) => {
          const { x, y } = viTri(m);
          const laDoc = dangDoc === m;
          const laGuong = mucGuong === m;
          return (
            <g
              key={m}
              onClick={() => onChon?.(m)}
              style={{ cursor: onChon ? 'pointer' : 'default' }}
            >
              <rect
                x={x}
                y={y}
                width={O_RONG}
                height={O_CAO}
                rx={7}
                fill={laDoc ? '#DF37A7' : laGuong ? 'rgba(223,55,167,0.14)' : 'var(--bg)'}
                stroke={laDoc ? '#DF37A7' : 'var(--line)'}
                strokeWidth={1}
              />
              <text
                x={x + O_RONG / 2}
                y={y + O_CAO / 2 + 3}
                textAnchor="middle"
                style={{
                  fontSize: 8.5,
                  fill: laDoc ? '#FFFDF9' : 'var(--fg)',
                  fontWeight: laDoc ? 600 : 400,
                }}
              >
                {CHU_12_CUNG.vi[m]?.nhan ?? m}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="caption" style={{ color: 'var(--fg-muted)' }}>
        Nét đứt là tấm gương: phần này được đọc qua phần kia. Bốn trong sáu đường bắc cầu sang
        chặng khác — nên không phần nào đọc một mình.
      </p>
    </figure>
  );
}
