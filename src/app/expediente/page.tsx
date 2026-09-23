"use client";

import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Cargo,
  CompetenciaCritica,
  Trabajador,
  TrabajadorCompetencia,
  calcularEstado,
  ESTADO_LABEL,
  ESTADO_COLOR,
  EstadoCompetencia,
} from "@/lib/tipos";

// Esta pantalla asume, por ahora, una sola empresa (Vivetel). Cuando se
// sume el laboratorio, aquí se agrega un selector de empresa y se filtra
// por empresa_id en cada consulta — el modelo de datos ya está listo para
// eso, solo falta esta pantalla.

export default function ExpedientePage() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [competencias, setCompetencias] = useState<CompetenciaCritica[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [registros, setRegistros] = useState<TrabajadorCompetencia[]>([]);

  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  async function cargarTodo() {
    setCargando(true);
    setError(null);
    try {
      const [cargosRes, competenciasRes, trabajadoresRes, registrosRes] =
        await Promise.all([
          supabase.from("cargos").select("*").order("nombre"),
          supabase.from("competencias_criticas").select("*").order("nombre"),
          supabase
            .from("trabajadores")
            .select("*")
            .order("apellidos"),
          supabase.from("trabajador_competencias").select("*"),
        ]);

      if (cargosRes.error) throw cargosRes.error;
      if (competenciasRes.error) throw competenciasRes.error;
      if (trabajadoresRes.error) throw trabajadoresRes.error;
      if (registrosRes.error) throw registrosRes.error;

      setCargos(cargosRes.data ?? []);
      setCompetencias(competenciasRes.data ?? []);
      setTrabajadores(trabajadoresRes.data ?? []);
      setRegistros(registrosRes.data ?? []);
    } catch (e: any) {
      setError(
        e?.message ??
          "No se pudo cargar la información. Revise que las tablas ya existan en Supabase."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargoPorId = useMemo(() => {
    const m = new Map<string, Cargo>();
    cargos.forEach((c) => m.set(c.id, c));
    return m;
  }, [cargos]);

  const competenciaPorId = useMemo(() => {
    const m = new Map<string, CompetenciaCritica>();
    competencias.forEach((c) => m.set(c.id, c));
    return m;
  }, [competencias]);

  const registrosPorTrabajador = useMemo(() => {
    const m = new Map<string, TrabajadorCompetencia[]>();
    registros.forEach((r) => {
      const lista = m.get(r.trabajador_id) ?? [];
      lista.push(r);
      m.set(r.trabajador_id, lista);
    });
    return m;
  }, [registros]);

  function peorEstado(trabajadorId: string): EstadoCompetencia {
    const propios = registrosPorTrabajador.get(trabajadorId) ?? [];
    if (propios.length === 0) return "sin_registro";
    const orden: EstadoCompetencia[] = [
      "vencida",
      "por_vencer",
      "sin_registro",
      "vigente",
    ];
    let peor: EstadoCompetencia = "vigente";
    for (const r of propios) {
      const comp = competenciaPorId.get(r.competencia_id);
      const estado = calcularEstado(
        r.fecha_vencimiento,
        comp?.dias_alerta_previos ?? 30
      );
      if (orden.indexOf(estado) < orden.indexOf(peor)) peor = estado;
    }
    return peor;
  }

  return (
    <main className="page" style={{ maxWidth: 960 }}>
      <p style={{ marginBottom: 4 }}>
        <a href="/" style={{ color: "#2e5395" }}>
          ← Volver
        </a>
      </p>
      <h1>Expediente del trabajador</h1>
      <p>
        Registro único por persona. Cada certificación (por ejemplo, trabajo
        en alturas) queda con su fecha de vencimiento y se marca sola cuando
        está por vencer o vencida.
      </p>

      {error && (
        <div className="card" style={{ borderColor: "#f5c2c7", background: "#f8d7da" }}>
          <strong>No se pudo cargar la información.</strong>
          <p style={{ margin: "6px 0 0" }}>{error}</p>
          <p style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>
            Lo más probable es que falte ejecutar el archivo{" "}
            <code>supabase/001_expediente_trabajador.sql</code> en el editor
            SQL de Supabase.
          </p>
        </div>
      )}

      {cargando && <p>Cargando...</p>}

      {!cargando && !error && (
        <>
          <div className="card">
            <button
              onClick={() => setMostrarFormNuevo((v) => !v)}
              style={botonEstilo}
            >
              {mostrarFormNuevo ? "Cancelar" : "+ Agregar trabajador"}
            </button>
            {mostrarFormNuevo && (
              <FormNuevoTrabajador
                cargos={cargos}
                onGuardado={() => {
                  setMostrarFormNuevo(false);
                  cargarTodo();
                }}
              />
            )}
          </div>

          <div className="card">
            <strong>
              {trabajadores.length} trabajador
              {trabajadores.length === 1 ? "" : "es"} registrado
              {trabajadores.length === 1 ? "" : "s"}
            </strong>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e5eb" }}>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Documento</th>
                  <th style={thStyle}>Cargo</th>
                  <th style={thStyle}>Vinculación</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {trabajadores.map((t) => {
                  const estado = peorEstado(t.id);
                  const color = ESTADO_COLOR[estado];
                  return (
                    <Fragment key={t.id}>
                      <tr style={{ borderBottom: "1px solid #f0f1f3" }}>
                        <td style={tdStyle}>
                          {t.nombres} {t.apellidos}
                        </td>
                        <td style={tdStyle}>{t.documento}</td>
                        <td style={tdStyle}>
                          {t.cargo_id ? cargoPorId.get(t.cargo_id)?.nombre ?? "—" : "—"}
                        </td>
                        <td style={tdStyle}>
                          {t.tipo_vinculacion === "directo" ? "Directo" : "Contratista"}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              background: color.bg,
                              color: color.fg,
                              borderRadius: 999,
                              padding: "2px 10px",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                            }}
                          >
                            {ESTADO_LABEL[estado]}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              setExpandidoId(expandidoId === t.id ? null : t.id)
                            }
                            style={{ ...botonEstilo, padding: "4px 10px", fontSize: "0.85rem" }}
                          >
                            {expandidoId === t.id ? "Cerrar" : "Competencias"}
                          </button>
                        </td>
                      </tr>
                      {expandidoId === t.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "#f7f8fa", padding: 16 }}>
                            <CompetenciasTrabajador
                              trabajador={t}
                              competencias={competencias}
                              registros={registrosPorTrabajador.get(t.id) ?? []}
                              onCambio={cargarTodo}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {trabajadores.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, color: "#808080" }}>
                      Todavía no hay trabajadores registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

const thStyle: CSSProperties = { padding: "8px 6px", fontSize: "0.85rem", color: "#555" };
const tdStyle: CSSProperties = { padding: "8px 6px" };
const botonEstilo: CSSProperties = {
  background: "#1f3864",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
  fontFamily: "Arial, sans-serif",
};

function FormNuevoTrabajador({
  cargos,
  onGuardado,
}: {
  cargos: Cargo[];
  onGuardado: () => void;
}) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [documento, setDocumento] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [tipoVinculacion, setTipoVinculacion] = useState<"directo" | "contratista">(
    "directo"
  );
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!nombres || !apellidos || !documento) {
      setError("Nombres, apellidos y documento son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);

    // Toma la empresa (por ahora solo existe Vivetel).
    const { data: empresas, error: empresaError } = await supabase
      .from("empresas")
      .select("id")
      .limit(1);

    if (empresaError || !empresas || empresas.length === 0) {
      setError("No se encontró la empresa. Verifique que el SQL inicial ya se ejecutó.");
      setGuardando(false);
      return;
    }

    const { error: insertError } = await supabase.from("trabajadores").insert({
      empresa_id: empresas[0].id,
      nombres,
      apellidos,
      documento,
      cargo_id: cargoId || null,
      tipo_vinculacion: tipoVinculacion,
      fecha_ingreso: fechaIngreso || null,
    });

    setGuardando(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onGuardado();
  }

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 480 }}>
      {error && <p style={{ color: "#c00000" }}>{error}</p>}
      <label>
        Nombres
        <input value={nombres} onChange={(e) => setNombres(e.target.value)} style={inputStyle} />
      </label>
      <label>
        Apellidos
        <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} style={inputStyle} />
      </label>
      <label>
        Documento
        <input value={documento} onChange={(e) => setDocumento(e.target.value)} style={inputStyle} />
      </label>
      <label>
        Cargo
        <select value={cargoId} onChange={(e) => setCargoId(e.target.value)} style={inputStyle}>
          <option value="">— Sin asignar —</option>
          {cargos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Vinculación
        <select
          value={tipoVinculacion}
          onChange={(e) => setTipoVinculacion(e.target.value as "directo" | "contratista")}
          style={inputStyle}
        >
          <option value="directo">Directo</option>
          <option value="contratista">Contratista</option>
        </select>
      </label>
      <label>
        Fecha de ingreso
        <input
          type="date"
          value={fechaIngreso}
          onChange={(e) => setFechaIngreso(e.target.value)}
          style={inputStyle}
        />
      </label>
      <button onClick={guardar} disabled={guardando} style={botonEstilo}>
        {guardando ? "Guardando..." : "Guardar trabajador"}
      </button>
    </div>
  );
}

function CompetenciasTrabajador({
  trabajador,
  competencias,
  registros,
  onCambio,
}: {
  trabajador: Trabajador;
  competencias: CompetenciaCritica[];
  registros: TrabajadorCompetencia[];
  onCambio: () => void;
}) {
  const [competenciaId, setCompetenciaId] = useState("");
  const [fechaObtencion, setFechaObtencion] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar() {
    if (!competenciaId || !fechaVencimiento) {
      setError("Elija la competencia y la fecha de vencimiento.");
      return;
    }
    setGuardando(true);
    setError(null);
    const { error: insertError } = await supabase.from("trabajador_competencias").insert({
      trabajador_id: trabajador.id,
      competencia_id: competenciaId,
      fecha_obtencion: fechaObtencion || null,
      fecha_vencimiento: fechaVencimiento,
    });
    setGuardando(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setCompetenciaId("");
    setFechaObtencion("");
    setFechaVencimiento("");
    onCambio();
  }

  return (
    <div>
      <strong>
        Competencias de {trabajador.nombres} {trabajador.apellidos}
      </strong>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, marginBottom: 12 }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th style={thStyle}>Competencia</th>
            <th style={thStyle}>Obtenida</th>
            <th style={thStyle}>Vence</th>
            <th style={thStyle}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => {
            const comp = competencias.find((c) => c.id === r.competencia_id);
            const estado = calcularEstado(r.fecha_vencimiento, comp?.dias_alerta_previos ?? 30);
            const color = ESTADO_COLOR[estado];
            return (
              <tr key={r.id}>
                <td style={tdStyle}>{comp?.nombre ?? "—"}</td>
                <td style={tdStyle}>{r.fecha_obtencion ?? "—"}</td>
                <td style={tdStyle}>{r.fecha_vencimiento ?? "—"}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      background: color.bg,
                      color: color.fg,
                      borderRadius: 999,
                      padding: "2px 10px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                    }}
                  >
                    {ESTADO_LABEL[estado]}
                  </span>
                </td>
              </tr>
            );
          })}
          {registros.length === 0 && (
            <tr>
              <td colSpan={4} style={{ ...tdStyle, color: "#808080" }}>
                Sin competencias registradas todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {error && <p style={{ color: "#c00000" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
        <label>
          Competencia
          <select
            value={competenciaId}
            onChange={(e) => setCompetenciaId(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Elegir —</option>
            {competencias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Obtenida
          <input
            type="date"
            value={fechaObtencion}
            onChange={(e) => setFechaObtencion(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label>
          Vence
          <input
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            style={inputStyle}
          />
        </label>
        <button onClick={agregar} disabled={guardando} style={botonEstilo}>
          {guardando ? "Guardando..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid #e2e5eb",
  borderRadius: 6,
  fontFamily: "Arial, sans-serif",
};
