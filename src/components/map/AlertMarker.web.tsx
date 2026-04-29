import type { LostReport } from '../../domain/lostReports';

interface AlertMarkerProps {
  report: LostReport;
  onPressCallout: (reportId: string) => void;
}

/**
 * En web usamos fallback sin Marker nativo para evitar crash de bundling.
 * El detalle/listado sigue disponible en la pestaña de alertas.
 */
export function AlertMarker(_props: AlertMarkerProps): null {
  return null;
}
