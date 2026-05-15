'use client'

import { useActionState, useRef } from 'react'
import { ImagePlus, Save, Building2, Mail, Phone, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { uploadLogo, updateIdentidad } from '@/modules/configuracion/actions-plantillas'
import type { EmpresaIdentidad } from '@/modules/configuracion/queries-plantillas'

type Props = {
  identidad: EmpresaIdentidad | null
  empresaSlug: string
}

type ActionResult = { ok: boolean; error?: string; logo_url?: string } | null

export function IdentidadPanel({ identidad, empresaSlug }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [logoState, logoAction, logoPending] = useActionState<ActionResult, FormData>(
    uploadLogo,
    null,
  )
  const [infoState, infoAction, infoPending] = useActionState<ActionResult, FormData>(
    updateIdentidad,
    null,
  )

  const currentLogo = (logoState?.ok && logoState.logo_url)
    ? logoState.logo_url
    : identidad?.logo_url ?? null

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <ImagePlus className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Logo de la clínica</h3>
            <p className="text-xs text-slate-500">Se imprime en todos los documentos generados. Máx 2 MB (PNG, JPG, WebP, SVG).</p>
          </div>
        </div>

        <form action={logoAction} className="space-y-4">
          <input type="hidden" name="empresaSlug" value={empresaSlug} />

          {/* Preview */}
          <div
            className="relative h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors group"
            onClick={() => fileRef.current?.click()}
          >
            {currentLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentLogo}
                alt="Logo clínica"
                className="max-h-28 max-w-full object-contain rounded"
              />
            ) : (
              <div className="text-center">
                <ImagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-indigo-400 transition-colors" />
                <p className="text-xs text-slate-400 font-medium">Haz clic para subir logo</p>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              Seleccionar archivo
            </button>

            <button
              type="submit"
              disabled={logoPending}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {logoPending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo…</>
                : <><Save className="w-3.5 h-3.5" /> Guardar logo</>
              }
            </button>
          </div>

          {logoState && (
            <div className={`flex items-center gap-2 text-xs font-bold rounded-lg px-3 py-2 ${logoState.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {logoState.ok
                ? <><CheckCircle className="w-3.5 h-3.5" /> Logo actualizado</>
                : <><XCircle className="w-3.5 h-3.5" /> {logoState.error}</>
              }
            </div>
          )}
        </form>
      </div>

      {/* Datos de contacto */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Datos de la clínica</h3>
            <p className="text-xs text-slate-500">Aparecen en el pie de página de los documentos generados.</p>
          </div>
        </div>

        <form action={infoAction} className="space-y-4">
          <input type="hidden" name="empresaSlug" value={empresaSlug} />

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1.5">
                <Mail className="w-3.5 h-3.5" /> Email de la clínica
              </span>
              <input
                type="email"
                name="email_clinica"
                defaultValue={identidad?.email_clinica ?? ''}
                placeholder="contacto@clinica.cl"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1.5">
                <Phone className="w-3.5 h-3.5" /> Teléfono
              </span>
              <input
                type="tel"
                name="telefono_clinica"
                defaultValue={identidad?.telefono_clinica ?? ''}
                placeholder="+56 2 2345 6789"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1.5">
                <MapPin className="w-3.5 h-3.5" /> Dirección
              </span>
              <input
                type="text"
                name="direccion_clinica"
                defaultValue={identidad?.direccion_clinica ?? ''}
                placeholder="Av. Providencia 1234, Santiago"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            {infoState && (
              <div className={`flex items-center gap-2 text-xs font-bold rounded-lg px-3 py-2 ${infoState.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {infoState.ok
                  ? <><CheckCircle className="w-3.5 h-3.5" /> Guardado</>
                  : <><XCircle className="w-3.5 h-3.5" /> {infoState.error}</>
                }
              </div>
            )}
            <button
              type="submit"
              disabled={infoPending}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {infoPending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</>
                : <><Save className="w-3.5 h-3.5" /> Guardar datos</>
              }
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}
