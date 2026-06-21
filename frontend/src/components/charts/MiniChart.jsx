import { useRef, useState, useEffect } from 'react';
import { COLORS, getMonthLabel } from './chartConstants';

const compact = (val) => {
  const n = Number(val) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
};

const fullNum = (val) => Number(val || 0).toLocaleString('vi-VN');

const truncate = (text, len = 12) => {
  const s = String(text || '');
  return s.length > len ? s.slice(0, len - 1) + '…' : s;
};

// Đo chiều rộng container (đặt setState trong ResizeObserver callback -> không vi phạm rule set-state-in-effect)
function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width || el.clientWidth;
      setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function Tooltip({ tip }) {
  if (!tip) return null;
  return (
    <div
      className="chart-tooltip"
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.lines.map((line, i) => (
        <div key={i} className={i === 0 ? 'chart-tooltip-title' : 'chart-tooltip-row'}>{line}</div>
      ))}
    </div>
  );
}

/* ========= BAR CHART ========= */
export function BarChart({ data = [], labelKey = 'month', valueKey = 'value', color = '#4f46e5', height = 260, unit = '' }) {
  const [ref, width] = useContainerWidth();
  const [tip, setTip] = useState(null);
  const W = width || 600;
  const H = height;

  const padTop = 24, padBot = 38, padLeft = 52, padRight = 16;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBot;

  const values = data.map((d) => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const pow = 10 ** Math.floor(Math.log10(maxVal || 1));
  const niceMax = Math.ceil(maxVal / pow) * pow || 1;

  const gridLines = 4;
  const barCount = data.length || 1;
  const gap = Math.max(8, (chartW * 0.15) / barCount);
  const barW = Math.max(6, Math.min(48, (chartW - gap * (barCount + 1)) / barCount));
  const totalBarArea = barCount * barW + (barCount + 1) * gap;
  const offsetX = padLeft + (chartW - totalBarArea) / 2;

  const labelOf = (d) => (labelKey === 'month' ? getMonthLabel(d[labelKey]) : (d[labelKey] || ''));

  return (
    <div className="chart-wrap" ref={ref} style={{ position: 'relative', width: '100%' }}>
      {width > 0 && (
        <svg width={W} height={H} role="img">
          {/* Grid + trục y */}
          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const y = padTop + chartH - (i / gridLines) * chartH;
            const val = (niceMax * i) / gridLines;
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={W - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{compact(val)}</text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const val = Number(d[valueKey]) || 0;
            const barH = (val / niceMax) * chartH;
            const x = offsetX + gap + i * (barW + gap);
            const y = padTop + chartH - barH;
            const gid = `bargrad_${valueKey}_${i}`;
            const onMove = (e) => {
              const box = ref.current.getBoundingClientRect();
              setTip({
                x: e.clientX - box.left + 12,
                y: e.clientY - box.top - 10,
                lines: [labelOf(d) || `Mục ${i + 1}`, `${fullNum(val)}${unit}`],
              });
            };
            return (
              <g key={i}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor={color + '44'} />
                  </linearGradient>
                </defs>
                {/* vùng hover rộng hơn bar để dễ trỏ */}
                <rect x={x - gap / 2} y={padTop} width={barW + gap} height={chartH} fill="transparent"
                  onMouseMove={onMove} onMouseLeave={() => setTip(null)} />
                <rect x={x} y={y} width={barW} height={Math.max(0, barH)} rx={Math.min(6, barW / 2)}
                  fill={`url(#${gid})`} style={{ pointerEvents: 'none' }} />
                {val > 0 && (
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b"
                    style={{ pointerEvents: 'none' }}>{compact(val)}</text>
                )}
                <text x={x + barW / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="#64748b"
                  style={{ pointerEvents: 'none' }}>{truncate(labelOf(d), 10)}</text>
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

/* ========= LINE CHART ========= */
export function LineChart({ datasets = [], labels = [], height = 260 }) {
  const [ref, width] = useContainerWidth();
  const [tip, setTip] = useState(null);
  const W = width || 600;
  const H = height;
  const padTop = 20, padBot = 36, padLeft = 48, padRight = 16;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBot;

  const allVals = datasets.flatMap((ds) => ds.data);
  const maxVal = Math.max(...allVals, 1);
  const niceMax = Math.ceil(maxVal * 1.15) || 1;
  const gridLines = 4;
  const xOf = (i) => padLeft + (i / Math.max(labels.length - 1, 1)) * chartW;
  const yOf = (v) => padTop + chartH - (v / niceMax) * chartH;

  return (
    <div className="chart-wrap" ref={ref} style={{ position: 'relative', width: '100%' }}>
      {width > 0 && (
        <svg width={W} height={H} role="img">
          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const y = padTop + chartH - (i / gridLines) * chartH;
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={W - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{Math.round((niceMax * i) / gridLines)}</text>
              </g>
            );
          })}
          {labels.map((l, i) => (
            <text key={i} x={xOf(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#64748b">{getMonthLabel(l)}</text>
          ))}
          {datasets.map((ds, di) => {
            const c = ds.color || COLORS[di % COLORS.length];
            const pts = ds.data.map((v, i) => ({ x: xOf(i), y: yOf(v), v }));
            const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            const areaPath = `M${pts[0]?.x},${padTop + chartH} ${pts.map((p) => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1]?.x},${padTop + chartH} Z`;
            return (
              <g key={di}>
                <path d={areaPath} fill={c + '18'} />
                <path d={linePath} fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="5" fill="#fff" stroke={c} strokeWidth="2.5"
                    onMouseMove={(e) => {
                      const box = ref.current.getBoundingClientRect();
                      setTip({ x: e.clientX - box.left + 12, y: e.clientY - box.top - 10, lines: [getMonthLabel(labels[i]), `${ds.label ? ds.label + ': ' : ''}${fullNum(p.v)}`] });
                    }}
                    onMouseLeave={() => setTip(null)} />
                ))}
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

/* ========= DONUT CHART ========= */
const polar = (cx, cy, r, angle) => ({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });

function arcPath(cx, cy, rOuter, rInner, start, end) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const p1 = polar(cx, cy, rOuter, start);
  const p2 = polar(cx, cy, rOuter, end);
  const p3 = polar(cx, cy, rInner, end);
  const p4 = polar(cx, cy, rInner, start);
  return [
    `M${p1.x},${p1.y}`,
    `A${rOuter},${rOuter} 0 ${largeArc} 1 ${p2.x},${p2.y}`,
    `L${p3.x},${p3.y}`,
    `A${rInner},${rInner} 0 ${largeArc} 0 ${p4.x},${p4.y}`,
    'Z',
  ].join(' ');
}

export function DonutChart({ segments = [], size = 200 }) {
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);
  const total = segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0);
  const cx = size / 2, cy = size / 2, rOuter = size / 2 - 8, rInner = rOuter * 0.62;

  const sweepOf = (seg) => (total > 0 ? ((Number(seg.value) || 0) / total) * Math.PI * 2 : 0);
  const arcs = segments.map((seg, i) => {
    const val = Number(seg.value) || 0;
    // Góc bắt đầu = tổng các phần trước (không mutate biến ngoài để tránh lỗi immutability)
    const start = -Math.PI / 2 + segments.slice(0, i).reduce((a, s) => a + sweepOf(s), 0);
    const sweep = sweepOf(seg);
    return { d: arcPath(cx, cy, rOuter, rInner, start, start + (sweep || 0.0001)), color: seg.color || COLORS[i % COLORS.length], seg, val };
  });

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ display: 'block' }} role="img">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color}
            onMouseMove={(e) => {
              const box = wrapRef.current.getBoundingClientRect();
              const pct = total > 0 ? Math.round((a.val / total) * 100) : 0;
              setTip({ x: e.clientX - box.left + 12, y: e.clientY - box.top - 10, lines: [a.seg.label || `Mục ${i + 1}`, `${fullNum(a.val)} (${pct}%)`] });
            }}
            onMouseLeave={() => setTip(null)} />
        ))}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

