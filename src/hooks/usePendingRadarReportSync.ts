import { useEffect, useRef } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

import {
  clearPendingRadarReport,
  loadPendingRadarReport,
} from '../services/pendingRadarReportStore';
import { reportsService } from '../services/reportsService';
import { strayService } from '../services/strayService';
import { LOST_REPORTS_QUERY_KEY } from './useLostReports';
import { STRAY_REPORTS_QUERY_KEY } from './useStrayReports';

/**
 * Reintenta en segundo plano el envío de un reporte de Radar guardado como
 * "Pendiente de enviar" (PRD §5.3.1) cuando el dispositivo recupera conexión.
 * Debe montarse una sola vez, cerca de la raíz de la app.
 */
export function usePendingRadarReportSync(): void {
  const netInfo = useNetInfo();
  const queryClient = useQueryClient();
  const isSyncingRef = useRef(false);

  const isOnline = netInfo.isConnected === true && netInfo.isInternetReachable !== false;

  useEffect(() => {
    if (!isOnline || isSyncingRef.current) return;

    let cancelled = false;
    isSyncingRef.current = true;

    void (async (): Promise<void> => {
      try {
        const draft = await loadPendingRadarReport();
        if (!draft || cancelled) return;

        if (draft.kind === 'lost') {
          await reportsService.createLostReport(draft.petId, draft.payload);
        } else {
          await strayService.create({
            ...draft.payload,
            seenAt: new Date(draft.payload.seenAt),
          });
        }

        if (cancelled) return;
        await clearPendingRadarReport();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [LOST_REPORTS_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [STRAY_REPORTS_QUERY_KEY] }),
        ]);
      } catch {
        // Se deja el borrador guardado; se reintentará en la próxima reconexión.
      } finally {
        isSyncingRef.current = false;
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [isOnline, queryClient]);
}
