import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransports } from '@/hooks/useTransports';
import { locationTracker } from '@/lib/locationTracker';

const ACTIVE = ['em_andamento', 'em_retorno', 'chegou_destino'];
const TRACKING_KEY = 'fenasoja_tracking';

/**
 * Continuidade de tracking apenas para o motorista que JÁ é dono no banco.
 *
 * Regras críticas:
 *  - NÃO reivindica GPS automaticamente. Reivindicação só pode acontecer via
 *    GESTO DIRETO do usuário (botão "Ativar GPS desta viagem" ou banner),
 *    porque iOS/Safari exige user gesture para `watchPosition`.
 *  - Só reanima o tracker para o motorista designado que já tinha
 *    `tracking_started_by_user_id === user.id` em alguma viagem ativa
 *    (ele aceitou permissão antes; aqui só restauramos depois de reload).
 *  - Visualizadores e admins NUNCA disparam `watchPosition` por aqui.
 */
export function useDriverAutoArm() {
  const { user } = useAuth();
  const { transports } = useTransports();

  useEffect(() => {
    if (!user?.id || !transports || transports.length === 0) return;

    const owned = transports.find(
      (t: any) =>
        ACTIVE.includes(t.status) &&
        t.motorista_user_id === user.id &&
        t.tracking_started_by_user_id === user.id,
    );

    if (!owned) {
      // Limpa cache antigo se ele não corresponder mais à realidade do banco.
      try {
        const raw = localStorage.getItem(TRACKING_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          const t = transports.find((x: any) => x.id === stored?.transportId);
          if (!t || !ACTIVE.includes(t.status) || t.tracking_started_by_user_id !== user.id) {
            localStorage.removeItem(TRACKING_KEY);
          }
        }
      } catch { /* ignore */ }
      return;
    }

    // Já sou dono no banco — restauro o watch apenas para esta viagem.
    void locationTracker.start(owned.id, user.id);
    try {
      localStorage.setItem(
        TRACKING_KEY,
        JSON.stringify({
          transportId: owned.id,
          userId: user.id,
          phase: owned.fase_atual || 'ida',
          startedAt: new Date().toISOString(),
        }),
      );
    } catch { /* ignore */ }
  }, [user?.id, transports]);
}
