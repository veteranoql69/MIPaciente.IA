-- ============================================================
-- Migración: 00045_view_saldo_cita.sql
-- Descripción: Vista que calcula saldo por cita (doc Agenda
--   V1.7 §10). No hay materialización — se calcula en vivo
--   desde mpaci_pagos_cita para garantizar consistencia.
--   Cuando el volumen lo exija, convertir a MATERIALIZED VIEW.
-- Módulo: Agenda — Financiero
-- Sprint: Ola C — Analítica
-- ============================================================

CREATE OR REPLACE VIEW public.mpaci_v_saldo_cita AS
SELECT
    c.id AS cita_id,
    c.empresa_id,
    c.precio_snapshot AS monto_total,

    COALESCE(SUM(CASE WHEN p.tipo IN ('pago', 'abono')    THEN p.monto ELSE 0 END), 0) AS total_pagado,
    COALESCE(SUM(CASE WHEN p.tipo = 'reembolso'            THEN p.monto ELSE 0 END), 0) AS total_reembolsado,
    COALESCE(SUM(CASE WHEN p.tipo = 'cortesia'             THEN p.monto ELSE 0 END), 0) AS total_cortesia,

    -- Saldo: lo que falta por pagar
    -- (monto_total - pagos + reembolsos - cortesías no cuentan como deuda)
    GREATEST(
        COALESCE(c.precio_snapshot, 0)
        - COALESCE(SUM(CASE WHEN p.tipo IN ('pago', 'abono') THEN p.monto ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN p.tipo = 'reembolso'         THEN p.monto ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN p.tipo = 'cortesia'          THEN p.monto ELSE 0 END), 0),
        0
    ) AS saldo_pendiente,

    -- Estado derivado para UI
    CASE
        WHEN COALESCE(c.precio_snapshot, 0) = 0 THEN 'sin_cargo'
        WHEN COALESCE(SUM(CASE WHEN p.tipo = 'cortesia' THEN p.monto ELSE 0 END), 0)
             >= COALESCE(c.precio_snapshot, 0) THEN 'cortesia'
        WHEN COALESCE(SUM(CASE WHEN p.tipo IN ('pago', 'abono') THEN p.monto ELSE 0 END), 0)
             >= COALESCE(c.precio_snapshot, 0) THEN 'pagado'
        WHEN COALESCE(SUM(CASE WHEN p.tipo IN ('pago', 'abono') THEN p.monto ELSE 0 END), 0) > 0
             THEN 'parcial'
        ELSE 'no_pagado'
    END AS estado_derivado

FROM public.mpaci_citas c
LEFT JOIN public.mpaci_pagos_cita p ON p.cita_id = c.id
GROUP BY c.id, c.empresa_id, c.precio_snapshot;

COMMENT ON VIEW public.mpaci_v_saldo_cita IS
    'Saldo por cita calculado en vivo desde pagos. Útil para dashboards y UI.
     Si el volumen lo requiere, convertir a MATERIALIZED VIEW con refresh
     post-INSERT en mpaci_pagos_cita. Doc Agenda V1.7 §10.';

-- ============================================================
-- Vista agregada por médico/fecha (para ocupación del cierre express)
-- ============================================================
CREATE OR REPLACE VIEW public.mpaci_v_citas_dia AS
SELECT
    c.empresa_id,
    c.medico_id,
    c.sucursal_id,
    DATE(c.fecha_inicio AT TIME ZONE 'UTC') AS fecha,
    COUNT(*) AS total_citas,
    COUNT(*) FILTER (WHERE c.estado_operativo = 'Realizada') AS citas_realizadas,
    COUNT(*) FILTER (WHERE c.estado_operativo = 'No asistió') AS citas_no_asistio,
    COUNT(*) FILTER (WHERE c.estado_operativo LIKE 'Cancelada%') AS citas_canceladas,
    COUNT(*) FILTER (WHERE c.estado_confirmacion = 'confirmada') AS citas_confirmadas,
    SUM(c.precio_snapshot) AS ingreso_bruto_esperado
FROM public.mpaci_citas c
GROUP BY c.empresa_id, c.medico_id, c.sucursal_id, DATE(c.fecha_inicio AT TIME ZONE 'UTC');

COMMENT ON VIEW public.mpaci_v_citas_dia IS
    'Agregado diario de citas por médico/sucursal. Base para dashboards
     de ocupación y producción. Doc Estadísticas V1.1 §2.';
