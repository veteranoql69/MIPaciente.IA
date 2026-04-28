import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

const resend = new Resend(process.env.RESEND_API_KEY)

function logDebug(msg: string) {
  const logPath = path.join(process.cwd(), 'doc', 'proxy_debug.log')
  const timestamp = new Date().toISOString()
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`)
  } catch (e) {
    console.error('Failed to write log:', e)
  }
}

const FROM = 'Mi-Paciente <noreply@noreply.sditecnologia.cl>'

const ROL_LABELS: Record<string, string> = {
  admin_general: 'Administrador General',
  admin: 'Administrador',
  medico: 'Médico / Cirujano',
  asistente: 'Asistente / Coordinador',
  enfermera_tens: 'Enfermera / TENS',
  externo: 'Colaborador Externo',
}

interface SendInvitationEmailParams {
  to: string
  clinicName: string
  inviterName: string
  rol: string
  codigo: string
}

export async function sendInvitationEmail({
  to,
  clinicName,
  inviterName,
  rol,
  codigo,
}: SendInvitationEmailParams) {
  const rolLabel = ROL_LABELS[rol] ?? rol
  // Formato visual del código: 3 + 3 dígitos separados por espacio
  const codigoDisplay = `${codigo.slice(0, 3)} ${codigo.slice(3)}`

  const html = buildEmailHtml({ clinicName, inviterName, rolLabel, codigoDisplay })

  logDebug(`[Email] Sending invitation to ${to} for clinic ${clinicName}...`)

  try {
    const response = await resend.emails.send({
      from: FROM,
      to,
      subject: `${inviterName} te invitó a unirte a ${clinicName} en Mi-Paciente`,
      html,
    })

    if (response.error) {
      logDebug(`[Email] Resend error for ${to}: ${JSON.stringify(response.error)}`)
      throw new Error(`Resend error: ${response.error.message}`)
    }

    logDebug(`[Email] Success! Message ID: ${response.data?.id} sent to ${to}`)
  } catch (err: any) {
    logDebug(`[Email] CRITICAL failure sending to ${to}: ${err.message}`)
    throw err
  }
}

function buildEmailHtml({
  clinicName,
  inviterName,
  rolLabel,
  codigoDisplay,
}: {
  clinicName: string
  inviterName: string
  rolLabel: string
  codigoDisplay: string
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación a ${clinicName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; padding: 0 16px; }
    .card {
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(79, 70, 229, 0.15);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      padding: 40px 40px 32px;
      text-align: center;
    }
    .header-logo {
      font-size: 15px;
      font-weight: 700;
      color: rgba(255,255,255,0.75);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
    }
    .header-sub {
      font-size: 15px;
      color: rgba(255,255,255,0.80);
      margin-top: 8px;
    }
    .body { padding: 40px; }
    .greeting {
      font-size: 16px;
      color: #1e293b;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .rol-badge {
      display: inline-block;
      background: #e0e7ff;
      color: #4338ca;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 14px;
      border-radius: 999px;
      margin: 0 4px;
    }
    .code-section {
      background: #f8fafc;
      border: 2px dashed #a5b4fc;
      border-radius: 16px;
      padding: 28px;
      text-align: center;
      margin: 28px 0;
    }
    .code-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 16px;
    }
    .code {
      font-size: 42px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: 0.15em;
      font-variant-numeric: tabular-nums;
    }
    .code-expires {
      font-size: 12px;
      color: #64748b;
      margin-top: 12px;
    }
    .steps {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 28px 0;
    }
    .steps-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 10px;
      font-size: 14px;
      color: #475569;
      line-height: 1.5;
    }
    .step:last-child { margin-bottom: 0; }
    .step-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #4f46e5;
      color: white;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .footer {
      padding: 24px 40px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .clinic-name { font-weight: 700; color: #4f46e5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="header-logo">Mi-Paciente</div>
        <div class="header-title">¡Te han invitado!</div>
        <div class="header-sub">Únete al equipo de <strong>${clinicName}</strong></div>
      </div>

      <div class="body">
        <p class="greeting">
          Hola,<br /><br />
          <strong>${inviterName}</strong> te ha invitado a unirte a
          <span class="clinic-name">${clinicName}</span> en Mi-Paciente
          con el rol de <span class="rol-badge">${rolLabel}</span>.
        </p>

        <div class="code-section">
          <div class="code-label">Tu código de acceso</div>
          <div class="code">${codigoDisplay}</div>
          <div class="code-expires">Válido por 48 horas · Un solo uso</div>
        </div>

        <div class="steps">
          <div class="steps-title">Cómo ingresar</div>
          <div class="step">
            <div class="step-num">1</div>
            <span>Ingresa a Mi-Paciente con tu cuenta de Google</span>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <span>Se abrirá la pantalla de bienvenida de <strong>${clinicName}</strong></span>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <span>Ingresa el código de 6 dígitos que aparece arriba</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p class="footer-text">
          Si no esperabas este correo, ignóralo sin problema.<br />
          Este código expira en 48 horas y solo puede usarse una vez.<br /><br />
          © ${new Date().getFullYear()} Mi-Paciente · Sistema de gestión clínica
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}
