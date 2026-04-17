/**
 * Pure function to calculate operational weather risk for transport.
 * Used both client and server side.
 */

export type WeatherRiskLevel = 'favoravel' | 'atencao' | 'alerta' | 'critico';

export interface NormalizedWeather {
  temperature_c?: number | null;
  feels_like_c?: number | null;
  humidity_pct?: number | null;
  precipitation_probability_pct?: number | null;
  precipitation_type?: string | null;
  thunderstorm_probability_pct?: number | null;
  wind_speed_kph?: number | null;
  wind_gust_kph?: number | null;
  visibility_km?: number | null;
  alert_count?: number | null;
  alerts_summary?: Array<{ severity?: string; title?: string }> | null;
  current_condition_label?: string | null;
}

export interface RiskResult {
  level: WeatherRiskLevel;
  reason: string;
}

const RISK_ORDER: Record<WeatherRiskLevel, number> = {
  favoravel: 0,
  atencao: 1,
  alerta: 2,
  critico: 3,
};

function escalate(current: RiskResult, candidate: RiskResult): RiskResult {
  return RISK_ORDER[candidate.level] > RISK_ORDER[current.level] ? candidate : current;
}

export function calculateOperationalRisk(w: NormalizedWeather): RiskResult {
  let result: RiskResult = { level: 'favoravel', reason: 'Condição climática estável nas próximas horas' };

  const precip = Number(w.precipitation_probability_pct ?? 0);
  const wind = Number(w.wind_speed_kph ?? 0);
  const gust = Number(w.wind_gust_kph ?? 0);
  const thunder = Number(w.thunderstorm_probability_pct ?? 0);
  const visibility = w.visibility_km != null ? Number(w.visibility_km) : null;
  const temp = w.temperature_c != null ? Number(w.temperature_c) : null;
  const alerts = w.alerts_summary ?? [];
  const alertCount = Number(w.alert_count ?? alerts.length);

  // CRÍTICO
  const severeAlert = alerts.find(
    (a) => (a.severity ?? '').toLowerCase().match(/severe|extreme|critic|grave|crítico|severo/),
  );
  if (severeAlert) {
    result = escalate(result, {
      level: 'critico',
      reason: `Alerta meteorológico severo ativo: ${severeAlert.title ?? 'condição crítica'}`,
    });
  }
  if (precip > 80 && wind > 50) {
    result = escalate(result, {
      level: 'critico',
      reason: 'Chuva intensa combinada com vento muito forte',
    });
  }
  if (visibility != null && visibility < 1) {
    result = escalate(result, {
      level: 'critico',
      reason: 'Visibilidade muito baixa pode comprometer o deslocamento',
    });
  }
  if (thunder > 70) {
    result = escalate(result, {
      level: 'critico',
      reason: 'Alta probabilidade de tempestade com raios',
    });
  }
  if (gust > 70) {
    result = escalate(result, {
      level: 'critico',
      reason: 'Rajadas de vento extremas previstas',
    });
  }

  // ALERTA
  if (alertCount > 0 && result.level !== 'critico') {
    result = escalate(result, {
      level: 'alerta',
      reason: `Alerta meteorológico ativo${alerts[0]?.title ? `: ${alerts[0].title}` : ' para a região'}`,
    });
  }
  if (precip > 60) {
    result = escalate(result, {
      level: 'alerta',
      reason: 'Alta probabilidade de chuva no horário do transporte',
    });
  }
  if (wind > 40) {
    result = escalate(result, {
      level: 'alerta',
      reason: 'Vento forte pode impactar o deslocamento',
    });
  }
  if (thunder > 40) {
    result = escalate(result, {
      level: 'alerta',
      reason: 'Probabilidade moderada de trovoadas',
    });
  }
  if (temp != null && (temp > 38 || temp < 5)) {
    result = escalate(result, {
      level: 'alerta',
      reason: temp > 38 ? 'Calor extremo previsto' : 'Frio extremo previsto',
    });
  }

  // ATENÇÃO
  if (precip > 30) {
    result = escalate(result, {
      level: 'atencao',
      reason: 'Chance moderada de chuva durante o transporte',
    });
  }
  if (wind > 25) {
    result = escalate(result, {
      level: 'atencao',
      reason: 'Vento moderado previsto',
    });
  }
  if (visibility != null && visibility < 5) {
    result = escalate(result, {
      level: 'atencao',
      reason: 'Visibilidade reduzida — atenção redobrada',
    });
  }
  const cond = (w.current_condition_label ?? '').toLowerCase();
  if (cond.match(/fog|mist|neblina|névoa/)) {
    result = escalate(result, {
      level: 'atencao',
      reason: 'Neblina pode reduzir a visibilidade',
    });
  }

  return result;
}

export const RISK_LABELS: Record<WeatherRiskLevel, string> = {
  favoravel: 'Favorável',
  atencao: 'Atenção',
  alerta: 'Alerta',
  critico: 'Crítico',
};
