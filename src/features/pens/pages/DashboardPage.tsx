import { CSSProperties, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiggyBank, Activity, Clock, Thermometer, AlertTriangle } from 'lucide-react';
import { getToken } from '../../auth/auth';
import { requestWithRetry, coerceArray, coerceNumber, coerceString } from '../../../shared/api/http';
import { createResilientWs } from '../../../shared/ws/resilientWs';
import MetricPill from '../../../shared/ui/MetricPill';

const API = import.meta.env.VITE_API_BASE_URL;
const WS = import.meta.env.VITE_WS_BASE_URL;

interface AbnormalPig {
  wid: number;
  activity: number;
  feeding_time: number;
}

interface Pen {
  pen_id: string;
  pen_name: string;
  current_pig_count: number;
  avg_activity_level: number;
  avg_feeding_time_minutes: number;
  avg_temperature_celsius: number;
  abnormal_pigs: AbnormalPig[];
}

interface Piggery {
  piggery_id: string;
  piggery_name: string;
  total_pigs: number;
  pens: Pen[];
}

interface PenListResponse {
  piggeies: Piggery[];
}

// pen_id에서 숫자 부분 추출 (예: "pen_3" → "3")
function penIdToParam(penId: string): string {
  const m = penId.match(/(\d+)/);
  return m ? m[1] : penId;
}

function coercePen(raw: Record<string, unknown>): Pen {
  return {
    pen_id: coerceString(raw.pen_id),
    pen_name: coerceString(raw.pen_name),
    current_pig_count: coerceNumber(raw.current_pig_count),
    avg_activity_level: coerceNumber(raw.avg_activity_level),
    avg_feeding_time_minutes: coerceNumber(raw.avg_feeding_time_minutes),
    avg_temperature_celsius: coerceNumber(raw.avg_temperature_celsius),
    abnormal_pigs: coerceArray(raw.abnormal_pigs),
  };
}

function coercePiggeries(data: unknown): Piggery[] {
  const resp = data as Record<string, unknown> | null;
  if (!resp) return [];

  // 서버 키 오타/변형 방어: piggeies / piggeries 둘 다 지원
  const raw = (resp.piggeies ?? resp.piggeries) as unknown;

  return coerceArray(raw).map((p) => {
    const pr = p as Record<string, unknown>;
    return {
      piggery_id: coerceString(pr.piggery_id),
      piggery_name: coerceString(pr.piggery_name),
      total_pigs: coerceNumber(pr.total_pigs),
      pens: coerceArray(pr.pens).map((pen) => coercePen(pen as Record<string, unknown>)),
    };
  });
}

/* ── 스타일 ── */

const pillBase: CSSProperties = {
  padding: '6px 18px',
  borderRadius: 9999,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
};

const pillActive: CSSProperties = {
  ...pillBase,
  background: '#3b82f6',
  color: '#fff',
};

const pillInactive: CSSProperties = {
  ...pillBase,
  background: '#f1f5f9',
  color: '#475569',
};

const card: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  padding: 20,
  width: 260,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  transition: 'box-shadow 0.15s',
};

const divider: CSSProperties = {
  height: 1,
  background: '#f1f5f9',
  margin: '4px 0',
};

const abnormalRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  color: '#64748b',
  padding: '4px 0',
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [piggeries, setPiggeries] = useState<Piggery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    requestWithRetry<PenListResponse>(`${API}/pens`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        const parsed = coercePiggeries(data);
        setPiggeries(parsed);
        if (parsed.length > 0 && !activeTab) setActiveTab(parsed[0].piggery_id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const handle = createResilientWs({
      url: `${WS}/ws/pens?token=${token}`,
      onMessage: (data) => {
        const parsed = coercePiggeries(data);
        setPiggeries(parsed);
        setActiveTab((prev) => {
          if (prev && parsed.some((p) => p.piggery_id === prev)) return prev;
          return parsed[0]?.piggery_id ?? null;
        });
      },
    });

    return () => handle.close();
  }, []);

  if (loading) return <p>{t('dashboard.loading')}</p>;

  const current = piggeries.find((pg) => pg.piggery_id === activeTab);

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>

      {/* 탭 pill */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {piggeries.map((pg) => (
          <button
            key={pg.piggery_id}
            onClick={() => setActiveTab(pg.piggery_id)}
            style={pg.piggery_id === activeTab ? pillActive : pillInactive}
          >
            {pg.piggery_name}
            <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 12 }}>
              {pg.total_pigs} {t('dashboard.totalPigs')}
            </span>
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {current && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {current.pens.map((pen) => (
            <div
              key={pen.pen_id}
              onClick={() => navigate(`/pens/${penIdToParam(pen.pen_id)}`)}
              style={card}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)'; }}
            >
              <strong style={{ fontSize: 16 }}>{pen.pen_name}</strong>

              <div style={divider} />

              <MetricPill icon={PiggyBank} label={t('dashboard.stock')} value={pen.current_pig_count} />
              <MetricPill icon={Activity} label={t('dashboard.activity')} value={pen.avg_activity_level.toFixed(1)} />
              <MetricPill icon={Clock} label={t('dashboard.feedingTime')} value={pen.avg_feeding_time_minutes.toFixed(1)} />
              <MetricPill icon={Thermometer} label={t('dashboard.temperature')} value={`${pen.avg_temperature_celsius.toFixed(1)}°C`} />

              {pen.abnormal_pigs.length > 0 && (
                <>
                  <div style={divider} />
                  <MetricPill
                    icon={AlertTriangle}
                    label={t('dashboard.abnormal')}
                    value={pen.abnormal_pigs.length}
                    valueColor="#ef4444"
                  />
                  <div
                    style={{
                      background: '#fef2f2',
                      borderRadius: 8,
                      padding: '6px 10px',
                    }}
                  >
                    {pen.abnormal_pigs.map((pig, i) => (
                      <div key={pig.wid ?? i} style={abnormalRow}>
                        <span style={{ fontWeight: 600, color: '#ef4444', minWidth: 44 }}>
                          #{pig.wid}
                        </span>
                        <Activity size={12} />
                        <span>{pig.activity}</span>
                        <Clock size={12} style={{ marginLeft: 4 }} />
                        <span>{pig.feeding_time}{t('dashboard.feedingUnit')}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
