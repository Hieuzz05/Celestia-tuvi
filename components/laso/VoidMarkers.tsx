'use client';

import { VI_TRI_GRID } from './types';

export interface VoidMarker {
  loai: 'tuan' | 'triet';
  cungs: [number, number];
}

const MAU: Record<VoidMarker['loai'], string> = {
  tuan: 'var(--fg-body)',
  triet: 'var(--chart-hung)',
};

/**
 * Tuần / Triệt án giữa 2 cung liền kề — render như một dải overlay nằm trên
 * đường biên chung của 2 ô, không đè lên tên sao.
 */
function Marker({ marker }: { marker: VoidMarker }) {
  const [a, b] = marker.cungs;
  const pa = VI_TRI_GRID[a];
  const pb = VI_TRI_GRID[b];
  const nhan = marker.loai === 'tuan' ? 'TUẦN' : 'TRIỆT';
  const mau = MAU[marker.loai];

  const cungRow = pa.row === pb.row;
  // Ô nằm sau trên trục biến thiên — biên chung là cạnh đầu của ô này
  const oSau = cungRow ? (pa.col > pb.col ? pa : pb) : pa.row > pb.row ? pa : pb;

  return (
    <div
      className="pointer-events-none relative z-20"
      style={{ gridRow: oSau.row, gridColumn: oSau.col }}
    >
      <div
        className="absolute flex items-center justify-center"
        style={
          cungRow
            ? { left: 0, top: '50%', transform: 'translate(-50%, -50%)' }
            : { top: 0, left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <span
          className="whitespace-nowrap px-[6px] py-[2px] text-[9px] font-semibold tracking-[0.08em]"
          style={{
            color: mau,
            border: `1px solid ${mau}`,
            background: 'var(--bg)',
            borderRadius: 9999,
            writingMode: cungRow ? 'vertical-rl' : 'horizontal-tb',
          }}
        >
          {nhan}
        </span>
      </div>
    </div>
  );
}

export function VoidMarkers({ markers }: { markers: VoidMarker[] }) {
  return (
    <>
      {markers.map((m) => (
        <Marker key={`${m.loai}-${m.cungs[0]}`} marker={m} />
      ))}
    </>
  );
}
