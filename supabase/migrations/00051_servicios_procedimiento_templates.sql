-- ============================================================
-- 00051 — Templates de Procedimiento Quirúrgico en mpaci_servicios
-- ============================================================
-- Qué hace:
--   Agrega 4 columnas a mpaci_servicios para almacenar el contenido
--   pre-llenado que aparece en el modal "Vista Procedimiento" de la
--   agenda cuando la cita corresponde a una cirugía o procedimiento.
--
-- Columnas nuevas:
--   descripcion_procedimiento  TEXT     — Qué se hace (informa al paciente)
--   cuidados_post_op           TEXT[]   — Lista cuidados post-operatorios
--   instrucciones_pre_op       TEXT[]   — Lista instrucciones previas
--   plantilla_consentimiento   TEXT     — Texto base del PDF de consentimiento
--
-- Uso en frontend:
--   Al abrir la Vista Procedimiento, el Server Action getProcedimientoTemplate(servicio_id)
--   retorna estos campos y pre-llena el formulario. El médico sólo edita lo necesario.
--   Luego se genera el PDF via Stirling PDF REST API (STIRLING_PDF_URL en .env).
-- ============================================================

ALTER TABLE public.mpaci_servicios
    ADD COLUMN IF NOT EXISTS descripcion_procedimiento TEXT,
    ADD COLUMN IF NOT EXISTS cuidados_post_op          TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS instrucciones_pre_op      TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS plantilla_consentimiento  TEXT;

COMMENT ON COLUMN public.mpaci_servicios.descripcion_procedimiento IS
    'Descripción del procedimiento para el paciente. Pre-llena la Vista Procedimiento en agenda.';
COMMENT ON COLUMN public.mpaci_servicios.cuidados_post_op IS
    'Lista de cuidados post-operatorios. Aparece en el PDF de protocolo quirúrgico.';
COMMENT ON COLUMN public.mpaci_servicios.instrucciones_pre_op IS
    'Lista de instrucciones pre-operatorias para el paciente.';
COMMENT ON COLUMN public.mpaci_servicios.plantilla_consentimiento IS
    'Texto base del consentimiento informado. Se fusiona con datos del paciente para generar el PDF via Stirling PDF.';

-- ============================================================
-- Populate: 12 servicios del catálogo Urbamed/Urología Demo
-- UUIDs corresponden al seed (reset_and_seed_staging.sql)
-- ============================================================

-- ── Vasectomía sin Bisturí ───────────────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La vasectomía sin bisturí (No-Scalpel Vasectomy) es una técnica de esterilización masculina definitiva. Se realiza bajo anestesia local con una única micro-punción en la línea media escrotal. Se aíslan y seccionan los conductos deferentes sin necesidad de sutura cutánea. Duración aproximada: 20-25 minutos. Alta inmediata.',
    cuidados_post_op = ARRAY[
        'Reposo relativo 48 horas. Evitar esfuerzo físico intenso.',
        'Aplicar hielo envuelto en tela (no directo) en la zona durante las primeras 24h, 15 min c/2h.',
        'Usar ropa interior de sostén (boxer ajustado) por 5-7 días.',
        'Analgesia: Ibuprofeno 400mg c/8h por 3 días si hay molestia.',
        'Evitar relaciones sexuales por 7 días.',
        'Espermatograma de control a los 3 meses (día 90) para confirmar azoospermia.',
        'Usar anticonceptivos hasta confirmar azoospermia.',
        'Consultar de inmediato si: fiebre > 38°C, hematoma creciente, dolor intenso.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ducha completa la mañana del procedimiento con jabón antiséptico.',
        'Rasurado de la zona escrotal (puede hacerse en casa la noche anterior).',
        'Usar ropa interior cómoda de algodón el día del procedimiento.',
        'No requiere ayuno.',
        'Traer acompañante para el regreso (no es estrictamente necesario pero recomendado).',
        'Comunicar cualquier medicamento anticoagulante (AAS, Clopidogrel, etc.) con 7 días de anticipación.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — VASECTOMÍA SIN BISTURÍ

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, declaro haber recibido información detallada sobre el procedimiento de vasectomía sin bisturí, sus riesgos, alternativas y naturaleza definitiva como método de esterilización masculina.

ENTIENDO QUE:
1. La vasectomía es un procedimiento de esterilización PERMANENTE. Aunque existe una técnica de reversión (vasovasostomía), el éxito no está garantizado.
2. La azoospermia no es inmediata. Se requiere un espermatograma de control a los 3 meses.
3. El procedimiento no protege contra enfermedades de transmisión sexual.
4. Complicaciones posibles (< 5%): hematoma escrotal, infección, espermatocele, granuloma espermático.

He tenido la oportunidad de hacer preguntas y éstas han sido respondidas satisfactoriamente.

Autorizo al Dr. {{nombre_medico}} y su equipo a realizar el procedimiento.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000002';


-- ── Circuncisión Adulto ZSR (sin suturas) ───────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La circuncisión con dispositivo ZSR (Zhenxi Shang Ring) es una técnica moderna sin suturas que utiliza un anillo plástico estéril. Se aplica anestesia local y se coloca el anillo que comprime y secciona el prepucio de forma controlada. El anillo cae espontáneamente en 7-14 días dejando una cicatriz limpia. Duración: 15-20 minutos. Alta inmediata.',
    cuidados_post_op = ARRAY[
        'No retirar el anillo ZSR. Caerá solo en 7-14 días.',
        'Higiene diaria: lavar suavemente con agua tibia y jabón neutro desde el día 2.',
        'Cubrir con gasa estéril los primeros 3-5 días para proteger el anillo.',
        'Analgesia: Paracetamol 500mg c/8h o Ibuprofeno 400mg c/8h si hay molestia.',
        'Evitar baños de tina, piscina o jacuzzi hasta que el anillo haya caído y la herida cicatrice.',
        'Usar ropa interior holgada para evitar roce.',
        'Control médico a los 10-14 días (o antes si el anillo no ha caído al día 14).',
        'Consultar de inmediato si: sangrado activo, fiebre, mal olor, anillo desplazado.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ducha completa con jabón antiséptico la mañana del procedimiento.',
        'Informar ALERGIAS especialmente a látex (el kit ZSR es libre de látex pero confirmar).',
        'No requiere ayuno.',
        'Usar ropa holgada el día del procedimiento (pantalón con cintura elástica).',
        'Traer calzoncillo de algodón ajustado (boxer) para usar post-procedimiento.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — CIRCUNCISIÓN CON DISPOSITIVO ZSR

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, declaro haber recibido información sobre la circuncisión con dispositivo ZSR, sus riesgos y cuidados.

ENTIENDO QUE:
1. El anillo ZSR permanecerá en su lugar por 7-14 días y caerá espontáneamente.
2. Complicaciones posibles (< 3%): sangrado, infección, cicatriz queloidea, retención del anillo.
3. En caso de alergia a látex, informar al médico ANTES del procedimiento.
4. El resultado estético final se evalúa a las 6-8 semanas post-procedimiento.

Autorizo al Dr. {{nombre_medico}} y su equipo a realizar el procedimiento.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000003';


-- ── Circuncisión Adulto con Suturas ─────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'Circuncisión clásica con técnica de sutura. Se realiza bajo anestesia local o sedación. El cirujano reseca el prepucio y sutura la herida con material reabsorbible (Vicryl 3-0 o 4-0). Permite mayor control del resultado estético y manejo de casos complejos (fimosis severa, balanitis recurrente). Duración: 40-50 minutos.',
    cuidados_post_op = ARRAY[
        'Higiene diaria con agua tibia y jabón neutro desde el día 2.',
        'Las suturas son reabsorbibles: no requieren retiro. Se caen en 2-3 semanas.',
        'Analgesia: Ibuprofeno 400mg c/8h por 5-7 días.',
        'Evitar erecciones las primeras 2 semanas (el médico puede indicar medicación si es necesario).',
        'Abstinencia sexual por 4-6 semanas.',
        'No nadar ni baños de tina por 3 semanas.',
        'Control a los 7 días para revisión de herida.',
        'Consultar si: sangrado activo, dehiscencia de sutura, fiebre > 38°C.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ducha con jabón antiséptico la mañana del procedimiento.',
        'Ayuno de 4 horas si se usará sedación (consultar con el médico).',
        'Informar medicamentos anticoagulantes con 7 días de anticipación.',
        'Traer ropa holgada el día del procedimiento.',
        'Comunicar alergias a anestésicos locales o látex.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — CIRCUNCISIÓN CON SUTURAS

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, autorizo al Dr. {{nombre_medico}} a realizar la circuncisión quirúrgica con suturas bajo anestesia local/sedación según corresponda.

RIESGOS INFORMADOS: sangrado post-op (< 5%), infección (< 3%), cicatriz queloidea, resultado estético no satisfactorio, sensibilidad glande alterada transitoria.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000004';


-- ── Próstata Rezum (Vapor de Agua) ──────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'El tratamiento Rezum utiliza vapor de agua (H₂O) para destruir selectivamente el tejido prostático hiperplásico que obstruye el flujo urinario. Se introduce una sonda uretral con un emisor que libera pulsos de vapor de 9 segundos directamente en la zona de transición de la próstata. Sin cortes, sin anestesia general. Se preserva la función sexual y eyaculatoria. Duración: 30-60 minutos. Alta el mismo día.',
    cuidados_post_op = ARRAY[
        'Puede necesitar sonda uretral por 3-5 días post-procedimiento (según inflamación).',
        'Analgesia: Ibuprofeno 400mg c/8h por 5 días. Paracetamol como alternativa si hay contraindicación a AINE.',
        'Antibiótico: según indicación médica (Ciprofloxacino u otro si hay alergia).',
        'Hidratación abundante: mínimo 2 litros de agua al día.',
        'Puede presentar disuria, urgencia urinaria y hematuria leve las primeras 2-4 semanas. Es normal.',
        'Control uroflujometría + residuo post-miccional a las 8 semanas.',
        'IPSS score repetir a las 8 semanas para evaluar respuesta.',
        'PSA de control a los 6 meses.',
        'Consultar si: fiebre > 38°C, retención urinaria completa, hematuria intensa.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ayuno de 4 horas previo al procedimiento.',
        'Traer exámenes: uroflujometría basal, ecografía prostática, PSA, orina completa.',
        'Urocultivo negativo requerido (si positivo, tratar ITU antes).',
        'Informar alergias (especialmente penicilina y AINEs).',
        'Suspender anticoagulantes según indicación médica (mínimo 5-7 días antes).',
        'Traer acompañante para el regreso.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — TRATAMIENTO REZUM (VAPOR DE AGUA PROSTÁTICO)

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, declaro haber recibido información sobre el tratamiento Rezum para hiperplasia prostática benigna.

ENTIENDO QUE:
1. El tratamiento Rezum es un procedimiento mínimamente invasivo que destruye tejido prostático con vapor de agua.
2. La mejoría sintomática ocurre gradualmente en 4-12 semanas.
3. Puede requerir sonda uretral temporal post-procedimiento.
4. Complicaciones posibles: disuria transitoria, hematuria leve, eyaculación retrógrada (poco frecuente), infección urinaria, retención urinaria aguda (< 2%).
5. En casos de alergia a penicilina, el antibiótico profiláctico se ajustará (Ciprofloxacino u otro).

Autorizo al Dr. {{nombre_medico}} y su equipo a realizar el procedimiento.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000005';


-- ── Biopsia Próstata por Fusión ──────────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La biopsia de próstata por fusión combina imágenes de Resonancia Magnética Multiparamétrica (RM-mp) con ecografía en tiempo real para tomar muestras precisas de zonas sospechosas (lesiones PIRADS ≥ 3). Se complementa con biopsias sistemáticas del resto de la glándula. Abordaje transperineal preferentemente. Requiere sedación consciente o anestesia local. Duración: 30-45 minutos.',
    cuidados_post_op = ARRAY[
        'Antibiótico post-biopsia: según pauta médica (Ciprofloxacino 500mg c/12h por 5 días).',
        'Hematuria, hemospermia y sangre en deposiciones son normales hasta 2-4 semanas.',
        'Hidratación abundante las primeras 48 horas.',
        'Evitar actividad física intensa 48 horas.',
        'Abstinencia sexual por 7 días.',
        'Resultado de anatomía patológica en 7-10 días hábiles.',
        'Control PSA a los 6 meses.',
        'RM mpróstata de control según indicación médica (generalmente 12 meses).',
        'Consultar si: fiebre > 38°C, retención urinaria, sangrado excesivo.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ayuno de 4-6 horas si se utilizará sedación consciente.',
        'Traer RM mpróstata previa en formato DICOM (CD o pendrive).',
        'Urocultivo negativo requerido previo (si positivo, postergar biopsia).',
        'PSA basal reciente (< 3 meses).',
        'Suspender anticoagulantes según indicación médica (AAS al menos 5 días antes).',
        'Enema de limpieza si el abordaje es transrectal (el médico indicará).',
        'Traer acompañante: no puede conducir si recibió sedación.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — BIOPSIA DE PRÓSTATA POR FUSIÓN (ECO-RM)

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, declaro haber sido informado sobre la biopsia de próstata por fusión de imágenes.

ENTIENDO QUE:
1. El procedimiento toma muestras de tejido prostático guiadas por fusión de RM y ecografía.
2. Los resultados de anatomía patológica estarán disponibles en 7-10 días hábiles.
3. Complicaciones posibles: hematuria, hemospermia y sangre en deposiciones (normales hasta 4 semanas), infección (prostatitis séptica < 1%), retención urinaria aguda (< 1%), vasovagal.
4. Un resultado negativo no descarta completamente la presencia de cáncer.

Autorizo al Dr. {{nombre_medico}} y su equipo a realizar el procedimiento.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000006';


-- ── HoLEP — Enucleación Láser Prostática ────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'HoLEP (Holmium Laser Enucleation of the Prostate) es el gold standard quirúrgico para hiperplasia prostática benigna severa. Se introduce un resectoscopio por vía uretral y con láser Holmium se enuclean los lóbulos prostáticos hiperplásicos en su totalidad. El tejido se extrae con un morcelador mecánico. Requiere anestesia raquídea u general. Hospitalización 1 noche. Resultado funcional permanente.',
    cuidados_post_op = ARRAY[
        'Sonda Foley 22Fr permanece las primeras 24-48h con irrigación vesical continua.',
        'Alta con sonda: se retira en control ambulatorio (generalmente al 2° día).',
        'Hematuria leve es normal hasta 2-4 semanas.',
        'Incontinencia urinaria transitoria de esfuerzo: normal y mejora en 4-12 semanas.',
        'Analgesia: Paracetamol 1g c/8h. AINEs según función renal.',
        'Hidratación oral mínima 2 litros/día.',
        'Control uroflujometría + residuo post-miccional a las 6 semanas.',
        'PSA de control a los 3-6 meses (puede bajar significativamente).',
        'Si IRC: control creatinina a las 48h post-op y según indicación nefrólogo.',
        'Consultar urgente si: retención urinaria al retirar sonda, fiebre > 38°C, hematuria intensa con coágulos.'
    ],
    instrucciones_pre_op = ARRAY[
        'Evaluación cardiológica si ASA III (obligatoria antes de programar).',
        'Evaluación nefrológica si IRC (TFG < 60 ml/min).',
        'Ayuno estricto 8 horas previo.',
        'Suspender AAS 7 días antes. Anticoagulantes según indicación hematólogo/cardiólogo.',
        'Traer exámenes: hemograma, coagulación, creatinina, orina completa, ECG, eco prostática.',
        'Urocultivo negativo obligatorio.',
        'Informar alergia a contraste yodado (afecta uso de fluoroscopía).',
        'Preparar hospitalizarse 1 noche. Traer artículos personales.',
        'Acompañante obligatorio el día de la cirugía.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — HoLEP (ENUCLEACIÓN LÁSER DE PRÓSTATA)

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, declaro haber recibido información sobre la cirugía HoLEP para tratamiento de hiperplasia prostática benigna severa.

ENTIENDO QUE:
1. HoLEP es una cirugía endoscópica que enuclea el tejido prostático obstructivo con láser Holmium. No requiere incisiones externas.
2. El tejido extraído se envía a anatomía patológica de rutina.
3. Hospitalización esperada: 1 noche.
4. Complicaciones posibles: incontinencia urinaria transitoria (4-12 semanas), eyaculación retrógrada (60-90% de los casos — infertilidad), estenosis uretral tardía (< 3%), reintervención (< 2%).
5. En caso de IRC, se realizará vigilancia de función renal post-op.

Autorizo al Dr. {{nombre_medico}} y su equipo a realizar el procedimiento.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000009';


-- ── Cistoscopia Diagnóstica ──────────────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La cistoscopia diagnóstica permite visualizar directamente el interior de la uretra y vejiga mediante un cistoscopio flexible de alta resolución. Se aplica gel anestésico local (Lidocaína 2% gel). Permite diagnosticar hematuria, tumores vesicales, estenosis uretral, litiasis y otras patologías. Duración: 15-20 minutos. Alta inmediata.',
    cuidados_post_op = ARRAY[
        'Hidratación abundante las siguientes 24 horas (al menos 2 litros).',
        'Puede presentar ardor o disuria leve al orinar durante 24-48 horas. Es normal.',
        'Hematuria leve (orina rosada) puede ocurrir. Cede espontáneamente.',
        'No requiere antibiótico de rutina salvo indicación específica.',
        'Puede reiniciar actividades normales el mismo día.',
        'Consultar si: fiebre > 38°C, retención urinaria, hematuria con coágulos, dolor intenso.'
    ],
    instrucciones_pre_op = ARRAY[
        'No requiere ayuno.',
        'Urocultivo negativo previo (si positivo, tratar y reprogramar).',
        'Informar alergias a anestésicos locales (Lidocaína).',
        'No es necesario acompañante (puede conducir tras el procedimiento).',
        'Puede tomar medicamentos habituales con agua el día del procedimiento.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — CISTOSCOPIA DIAGNÓSTICA

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, autorizo al Dr. {{nombre_medico}} a realizar la cistoscopia diagnóstica con cistoscopio flexible.

RIESGOS INFORMADOS: disuria transitoria (frecuente, leve), infección urinaria (< 2%), sangrado (muy raro con cistoscopio flexible).

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000007';


-- ── Litotricia Extracorpórea (LEOC) ─────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La Litotricia Extracorpórea por Ondas de Choque (LEOC) fragmenta cálculos urinarios (renales, ureterales o vesicales) sin cirugía, mediante ondas de choque focalizadas externamente. El equipo Dornier Delta II localiza el cálculo por fluoroscopía y dirige las ondas para fragmentarlo. Los fragmentos son eliminados naturalmente con la orina. Duración: 30-45 minutos. Alta inmediata.',
    cuidados_post_op = ARRAY[
        'Filtrar la orina en casa con una malla fina durante 1-2 semanas para recuperar fragmentos.',
        'Hidratación abundante: mínimo 2-3 litros de agua al día.',
        'Analgesia: Ibuprofeno 400mg c/8h o Paracetamol 1g c/8h si hay cólico.',
        'Hematuria leve es normal las primeras 24-48 horas.',
        'Puede presentar cólico renal al eliminar los fragmentos. Aumentar analgesia según indicación.',
        'Orina completa + sedimento a las 48 horas.',
        'Ecografía de control en 4 semanas para verificar ausencia de litiasis residual.',
        'Consultar urgente si: cólico severo refractario a analgesia, fiebre > 38°C, retención urinaria.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ayuno de 4 horas previo (se puede usar sedación suave si el paciente es ansioso).',
        'Urocultivo negativo obligatorio previo al procedimiento.',
        'Traer imágenes previas: TAC sin contraste o ecografía con medida del cálculo.',
        'Informar si usa marcapasos (contraindicación relativa).',
        'Informar alergias a AINEs o anticoagulantes activos.',
        'No requiere internación. Puede venir solo.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — LITOTRICIA EXTRACORPÓREA (LEOC)

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, autorizo al Dr. {{nombre_medico}} a realizar la litotricia extracorpórea por ondas de choque.

ENTIENDO QUE:
1. El procedimiento puede requerir más de una sesión dependiendo del tamaño y densidad del cálculo.
2. La fragmentación completa no está garantizada en una sola sesión.
3. Complicaciones posibles: hematoma renal subcapsular (raro, < 1%), cólico renal por paso de fragmentos (frecuente), infección urinaria, obstrucción por fragmentos ("steinstrasse") que puede requerir procedimiento adicional.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000015';


-- ── Nefrolitotomía Percutánea (NLP) ─────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La Nefrolitotomía Percutánea (NLP) es el tratamiento de elección para cálculos renales > 20mm o cálculos coraliformes. Se crea un trayecto percutáneo (punción guiada por fluoroscopía/ecografía) desde la espalda hacia el sistema colector renal. A través de este trayecto se introduce un nefroscopio y se fragmenta y extrae el cálculo. Requiere anestesia general. Hospitalización 2-3 noches.',
    cuidados_post_op = ARRAY[
        'Nefrostomía (sonda percutánea renal) permanece 24-48h post-op para drenaje.',
        'Catéter doble J interno puede quedar por 2-4 semanas (retiro posterior en policlínico).',
        'Hematuria moderada los primeros días es normal.',
        'Analgesia: según pauta del equipo (generalmente Ketorolaco + Paracetamol en hospital).',
        'Antibiótico: según urocultivo y pauta del cirujano.',
        'Hidratación IV en hospital + oral abundante al alta.',
        'Control de función renal (creatinina) a las 48h post-op.',
        'TAC de control sin contraste a las 4 semanas para evaluar litiasis residual.',
        'Consultar urgente si: fiebre > 38°C, sangrado por nefrostomía, dolor intenso.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ayuno estricto 8 horas previo.',
        'Traer TAC renal sin contraste impreso (obligatorio el día de la cirugía).',
        'Hemograma, coagulación, creatinina, orina completa y cultivo pre-operatorios.',
        'ECG si mayor de 50 años o comorbilidades cardiovasculares.',
        'Suspender AAS 7 días antes. Anticoagulantes: seguir indicación médica.',
        'Informar alergia a antibióticos (especialmente cotrimoxazol y penicilina).',
        'Prepararse para hospitalización de 2-3 noches.',
        'Acompañante obligatorio el día de la cirugía y para el alta.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — NEFROLITOTOMÍA PERCUTÁNEA (NLP)

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, declaro haber sido informado sobre la cirugía de nefrolitotomía percutánea.

ENTIENDO QUE:
1. Es una cirugía mayor que requiere hospitalización de 2-3 noches.
2. Puede ser necesaria más de una sesión si el cálculo es muy grande (NLP escalonada).
3. Complicaciones posibles: sangrado que puede requerir transfusión (< 5%), infección (sepsis urinaria < 2%), lesión de órganos adyacentes (pleura, colon — muy raro), fracaso en acceso percutáneo que requiera reconversión.
4. En caso de alergia a antibióticos específicos, la profilaxis se ajustará según indicación médica.

Autorizo al Dr. {{nombre_medico}} y su equipo a realizar el procedimiento.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000008';


-- ── Ureteroscopia Rígida (URS) ───────────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La ureteroscopia rígida (URS) con láser Holmium trata cálculos ureterales que no pasan espontáneamente. Se introduce un ureteroscopio 8/9.8 Fr por vía uretral hasta el cálculo y se fragmenta con pulsos de láser. Los fragmentos se extraen con canasta Nitinol. Se instala catéter doble J temporal para proteger el uréter. Requiere anestesia raquídea. Alta el mismo día o a las 24 horas.',
    cuidados_post_op = ARRAY[
        'Catéter doble J (DJ) instalado: puede causar disuria, urgencia miccional, molestia lumbar al orinar. Es normal.',
        'Analgesia: Ibuprofeno 400mg + Solifenacina 5mg (si hay espasmo vesical) por 5-7 días.',
        'Hidratación abundante: 2 litros/día.',
        'Hematuria leve normal hasta retirar el DJ.',
        'Retiro del catéter DJ en 2-4 semanas (coordinado en policlínico con cistoscopia).',
        'Rx de tórax o eco de control para verificar ausencia de litiasis residual a las 4 semanas.',
        'No realizar actividad física intensa hasta retiro del DJ.',
        'Consultar si: fiebre > 38°C, cólico severo, retención urinaria, hematuria con coágulos.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ayuno estricto 8 horas previo.',
        'Urocultivo negativo obligatorio (si positivo, tratar ITU antes).',
        'Traer TAC o ecografía reciente con localización del cálculo.',
        'Hemograma + coagulación + creatinina pre-op.',
        'Suspender AAS 5-7 días antes.',
        'Acompañante obligatorio (no puede conducir tras anestesia raquídea).',
        'Informar alergia a látex o anestésicos.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — URETEROSCOPIA RÍGIDA (URS) CON LÁSER

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, autorizo al Dr. {{nombre_medico}} a realizar la ureteroscopia rígida con litotripsia láser.

RIESGOS INFORMADOS: disuria con catéter DJ (frecuente, transitoria), hematuria leve (frecuente), infección urinaria (< 3%), perforación ureteral (< 1%), estenosis ureteral tardía (< 1%), migración o fractura del catéter DJ.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000016';


-- ── Orquidopexia ─────────────────────────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La orquidopexia trata el hidrocele (acumulación de líquido alrededor del testículo) mediante abordaje escrotal. Se drena el líquido y se realiza eversión o plicatura de la túnica vaginal (técnica Jaboulay o Lord) para prevenir la reacumulación. Bajo sedación + anestesia local. Alta 1-2 horas post-procedimiento. También aplica para corrección de testículo no descendido en adultos.',
    cuidados_post_op = ARRAY[
        'Reposo relativo 24-48 horas.',
        'Usar ropa interior de sostén (boxer ajustado) por 2 semanas.',
        'Hielo local envuelto en tela 15 min c/3h las primeras 24h.',
        'Analgesia: Ibuprofeno 400mg c/8h por 5-7 días.',
        'Ducharse puede reiniciarse a las 48 horas. No sumergir en agua por 2 semanas.',
        'Las suturas son reabsorbibles (Vicryl 3-0). No requieren retiro.',
        'Control a los 7 días para revisión de herida.',
        'Ecografía escrotal al mes para confirmar resolución del hidrocele.',
        'Consultar si: hematoma escrotal creciente, fiebre > 38°C, infección de herida.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ayuno de 4 horas si se utilizará sedación.',
        'Ducha con jabón antiséptico la mañana del procedimiento.',
        'Informar alergias (especialmente látex).',
        'Traer ropa interior holgada para ponerse post-procedimiento.',
        'Acompañante recomendado (no indispensable si fue solo anestesia local).'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — ORQUIDOPEXIA / HIDROCELECTOMÍA

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, autorizo al Dr. {{nombre_medico}} a realizar la corrección quirúrgica del hidrocele.

RIESGOS INFORMADOS: hematoma escrotal (< 5%), infección (< 2%), recurrencia del hidrocele (< 5%), lesión del conducto deferente o vasos testiculares (muy raro).

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000012';


-- ── Uretroplastia ────────────────────────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La uretroplastia es la cirugía definitiva para la estenosis uretral. Para estenosis cortas (≤ 2cm) se realiza técnica anastomótica término-terminal: resección del segmento estenótico y anastomosis directa. Para estenosis largas se puede utilizar injerto de mucosa bucal (técnica de Barbagli). Requiere anestesia raquídea. Hospitalización 1-2 noches. Sonda Foley permanece 21 días post-cirugía.',
    cuidados_post_op = ARRAY[
        'Sonda Foley 16Fr permanece 21 días. NO retirar en casa. Retiro en policlínico.',
        'Cuidado de sonda: higiene del meato con agua y jabón 2 veces al día.',
        'Analgesia: Paracetamol 1g c/8h + Ibuprofeno 400mg c/8h alternado.',
        'Antibiótico profiláctico durante el tiempo de la sonda (según prescripción médica).',
        'Reposo relativo las primeras 2 semanas. Evitar esfuerzo físico.',
        'Uretrografía miccional de control post-retiro de sonda (confirma permeabilidad).',
        'Uroflujometría a los 3 meses.',
        'Tasa de éxito a largo plazo: 90-95% (técnica anastomótica).',
        'Consultar urgente si: no puede orinar con sonda en posición, fiebre > 38°C, sangrado activo.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ayuno estricto 8 horas previo.',
        'Traer uretrografía retrógrada y miccional reciente (obligatoria).',
        'Urocultivo negativo pre-op.',
        'Hemograma + coagulación + creatinina.',
        'ECG si mayor de 40 años.',
        'Suspender anticoagulantes según indicación médica.',
        'Prepararse para hospitalización 1-2 noches.',
        'Acompañante obligatorio.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — URETROPLASTIA

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, declaro haber sido informado sobre la cirugía de uretroplastia para estenosis uretral.

ENTIENDO QUE:
1. La sonda uretral permanecerá 21 días post-cirugía.
2. La técnica se define según las características de la estenosis (anastomótica vs. injerto de mucosa bucal).
3. Complicaciones posibles: fístula uretral (< 5%), recurrencia de la estenosis (5-10%), disfunción eréctil transitoria (< 5% en técnica anastomótica), acortamiento peneano mínimo.
4. En caso de requerir injerto de mucosa bucal, se explica procedimiento adicional en cavidad oral.

Autorizo al Dr. {{nombre_medico}} y su equipo a realizar el procedimiento.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000014';


-- ── Varicocelectomía Microquirúrgica ─────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La varicocelectomía microquirúrgica subinguinal es la técnica de elección para el varicocele clínico. Bajo microscopio quirúrgico, el cirujano identifica y liga selectivamente las venas espermáticas dilatadas preservando las arterias testiculares, linfáticos y el conducto deferente. Esto minimiza el riesgo de hidrocele post-op (< 1%) y atrofia testicular. Requiere anestesia espinal. Cirugía ambulatoria, alta el mismo día.',
    cuidados_post_op = ARRAY[
        'Reposo relativo 48 horas.',
        'Usar boxer ajustado de algodón por 2-3 semanas.',
        'Hielo local envuelto en tela 15 min c/3h las primeras 24h.',
        'Analgesia: Ibuprofeno 400mg c/8h por 5-7 días.',
        'No actividad física intensa por 2 semanas.',
        'Las suturas son reabsorbibles. No requieren retiro.',
        'Control a los 7 días para revisión de herida inguinal.',
        'Seminograma de control a los 3 y 6 meses post-cirugía.',
        'Resultado en mejoría seminal: se espera en 3-6 meses.',
        'Eco doppler escrotal al mes para confirmar resolución del varicocele.'
    ],
    instrucciones_pre_op = ARRAY[
        'Ayuno estricto 8 horas previo.',
        'Traer seminograma reciente (< 3 meses) y eco doppler escrotal.',
        'Hemograma + coagulación pre-op.',
        'Ducha con jabón antiséptico la mañana de la cirugía.',
        'Rasurado de la zona inguinal izquierda (puede hacerse la noche anterior).',
        'Acompañante obligatorio (no puede conducir tras anestesia espinal).'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — VARICOCELECTOMÍA MICROQUIRÚRGICA

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, declaro haber sido informado sobre la varicocelectomía microquirúrgica subinguinal.

ENTIENDO QUE:
1. El objetivo es mejorar los parámetros seminales para favorecer la fertilidad. El resultado no está garantizado.
2. La mejoría seminal puede tardar 3-6 meses en manifestarse.
3. Complicaciones posibles: hidrocele post-op (< 1% con técnica microquirúrgica), hematoma (< 2%), infección (< 1%), lesión arterial testicular (muy raro con microscopio), recurrencia del varicocele (< 5%).
4. La anestesia espinal puede causar cefalea post-punción (tratamiento disponible).

Autorizo al Dr. {{nombre_medico}} y su equipo a realizar el procedimiento.

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000017';


-- ── Extracción Quiste Epididimario ───────────────────────────────────────
UPDATE public.mpaci_servicios
SET
    descripcion_procedimiento = 'La extracción de quiste epididimario (epididimectomía parcial o quistectomía) elimina quistes benignos del epidídimo que generan molestia o crecimiento progresivo. Abordaje escrotal bajo anestesia local ± sedación. Se reseca el quiste preservando el epidídimo sano. Alta inmediata.',
    cuidados_post_op = ARRAY[
        'Reposo relativo 48 horas.',
        'Usar boxer ajustado por 1-2 semanas.',
        'Hielo local las primeras 24h.',
        'Analgesia: Ibuprofeno 400mg c/8h por 5 días.',
        'Control a los 7 días para revisión.',
        'Ducharse a las 48 horas. Sin baños de tina por 2 semanas.',
        'Consultar si: hematoma escrotal, fiebre, infección de herida.'
    ],
    instrucciones_pre_op = ARRAY[
        'No requiere ayuno si solo anestesia local.',
        'Ayuno 4h si se utilizará sedación.',
        'Traer ecografía escrotal reciente.',
        'Informar alergias a anestésicos.'
    ],
    plantilla_consentimiento = 'CONSENTIMIENTO INFORMADO — QUISTECTOMÍA EPIDIDIMARIA

Yo, {{nombre_paciente}}, RUT {{rut_paciente}}, autorizo al Dr. {{nombre_medico}} a realizar la extracción de quiste epididimario.

RIESGOS INFORMADOS: hematoma (< 3%), infección (< 2%), recurrencia del quiste (< 5%), lesión del epidídimo que puede afectar fertilidad (raro).

Firma Paciente: _______________________    Fecha: {{fecha}}
Firma Médico:   _______________________    RUT Médico: {{rut_medico}}'
WHERE id = 'c3000000-0000-0000-0000-000000000013';


-- Verificación
DO $$
DECLARE v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.mpaci_servicios
    WHERE descripcion_procedimiento IS NOT NULL;
    RAISE NOTICE '✓ 00051 — Templates procedimiento: % servicios actualizados', v_count;
END $$;
