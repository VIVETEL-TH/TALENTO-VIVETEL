"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  TemaCapacitacion,
  SesionCapacitacion,
  AsistenciaCapacitacion,
  Trabajador,
  CategoriaCapacitacion,
  CATEGORIA_LABEL,
} from "@/lib/tipos";
import { thStyle, tdStyle, botonEstilo, botonSecundarioEstilo, inputStyle, badgeEstilo } from "@/lib/estilos";

// Esta pantalla es el plan único de capacitación: un tema se define una
// sola vez y se dicta en varias sesiones. Al filtrar por categoría o por
// trabajador, se arma automáticamente el histórico transversal frente a
// todos los riesgos — incluido el COPASST — sin duplicar nada.

const CATEGORIAS: CategoriaCapacitacion[] = [
  "general",
  "alturas",
  "copasst",
  "convivencia",
  "emergencias",
  "vial",
  "salud",
];

export default function CapacitacionPage() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [temas, setTemas] = useState<TemaCapacitacion[]>([]);
  const [sesiones, setSesiones] = useState<SesionCapacitacion[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaCapacitacion[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);

  const [mostrarFormTema, setMostrarFormTema] = useState(false);
  const [mostrarFormSesion, setMostrarFormSesion] = useState(false);
  const [sesionExpandidaId, setSesionExpandidaId] = useState<string | null>(null);

  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaCapacitacion | "todas">("todas");
  const [filtroTrabajadorId, setFiltroTrabajadorId] = useState<string>("");

  async function cargarTodo() {
    setCargando(true);
    setError(null);
    try {
      const [temasRes, sesionesRes, asistenciasRes, trabajadoresRes] = await Promise.all([
        supabase.from("temas_capacitacion").select("*").order("nombre"),
        supabase.from("sesiones_capacitacion").select("*").order("fecha", { ascending: false }),
        supabase.from("asistencia_capacitacion").select("*"),
        supabase.from("trabajadores").select("*").order("apellidos"),
      ]);

      if (temasRes.error) throw temasRes.error;
      if (sesionesRes.error) throw sesionesRes.error;
      if (asistenciasRes.error) throw asistenciasRes.error;
      if (trabajadoresRes.error) throw trabajadoresRes.error;

      setTemas(temasRes.data ?? []);
      setSesiones(sesionesRes.data ?? []);
      setAsistencias(asistenciasRes.data ?? []);
      setTrabajadores(trabajadoresRes.data ?? []);
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

  const temaPorId = useMemo(() => {
    const m = new Map<string, TemaCapacitacion>();
    temas.forEach((t) => m.set(t.id, t));
    return m;
  }, [temas]);

  const asistenciasPorSesion = useMemo(() => {
    const m = new Map<string, AsistenciaCapacitacion[]>();
    asistencias.forEach((a) => {
      const lista = m.get(a.sesion_id) ?? [];
      lista.push(a);
      m.set(a.sesion_id, lista);
    });
    return m;
  }, [asistencias]);

  // Sesiones visibles según los filtros activos: por categoría del tema,
  // y/o por trabajador (solo sesiones a las que asistió).
  const sesionesFiltradas = useMemo(() => {
    return sesiones.filter((s) => {
      const tema = temaPorId.get(s.tema_id);
      if (filtroCategoria !== "todas" && tema?.categoria !== filtroCategoria) return false;
      if (filtroTrabajadorId) {
        const asistio = (asistenciasPorSesion.get(s.id) ?? []).some(
          (a) => a.trabajador_id === filtroTrabajadorId && a.asistio
        );
        if (!asistio) return false;
      }
      return true;
    });
  }, [sesiones, temaPorId, filtroCategoria, filtroTrabajadorId, asistenciasPorSesion]);

  // Cobertura por trabajador: cuántas sesiones (dentro del filtro de
  // categoría activo) ha recibido cada persona, transversal a todos los
  // temas que apliquen.
  const coberturaPorTrabajador = useMemo(() => {
    const m = new Map<string, number>();
    trabajadores.forEach((t) => m.set(t.id, 0));
    asistencias.forEach((a) => {
      if (!a.asistio) return;
      const sesion = sesiones.find((s) => s.id === a.sesion_id);
      if (!sesion) return;
      const tema = temaPorId.get(sesion.tema_id);
      if (filtroCategoria !== "todas" && tema?.categoria !== filtroCategoria) return;
      m.set(a.trabajador_id, (m.get(a.trabajador_id) ?? 0) + 1);
    });
    return m;
  }, [trabajadores, asistencias, sesiones, temaPorId, filtroCategoria]);

  return (
    <main className="page" style={{ maxWidth: 1040 }}>
      <p style={{ marginBottom: 4 }}>
        <a href="/" style={{ color: "#2e5395" }}>
          ← Volver
        </a>
      </p>
      <h1>Plan de capacitación</h1>
      <p>
        Un solo plan para toda la empresa. Cada tema se define una vez y se
        dicta en varias sesiones; al filtrar por categoría o por trabajador
        se arma solo el histórico completo, incluido lo del COPASST.
      </p>

      {error && (
        <div className="card" style={{ borderColor: "#f5c2c7", background: "#f8d7da" }}>
          <strong>No se pudo cargar la información.</strong>
          <p style={{ margin: "6px 0 0" }}>{error}</p>
          <p style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>
            Lo más probable es que falte ejecutar el archivo{" "}
            <code>supabase/002_capacitacion.sql</code> en el editor SQL de
            Supabase.
          </p>
        </div>
      )}

      {cargando && <p>Cargando...</p>}

      {!cargando && !error && (
        <>
          <div className="card">
            <strong>Filtrar vista transversal</strong>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
              <label style={{ minWidth: 220 }}>
                Categoría
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value as CategoriaCapacitacion | "todas")}
                  style={inputStyle}
                >
                  <option value="todas">Todas (vista transversal completa)</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORIA_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ minWidth: 220 }}>
                Trabajador
                <select
                  value={filtroTrabajadorId}
                  onChange={(e) => setFiltroTrabajadorId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Todos los trabajadores</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombres} {t.apellidos}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Temas del plan ({temas.length})</strong>
              <button onClick={() => setMostrarFormTema((v) => !v)} style={botonSecundarioEstilo}>
                {mostrarFormTema ? "Cancelar" : "+ Agregar tema"}
              </button>
            </div>
            {mostrarFormTema && (
              <FormNuevoTema
                onGuardado={() => {
                  setMostrarFormTema(false);
                  cargarTodo();
                }}
              />
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e5eb" }}>
                  <th style={thStyle}>Tema</th>
                  <th style={thStyle}>Categoría</th>
                  <th style={thStyle}>Horas</th>
                  <th style={thStyle}>Repite cada</th>
                </tr>
              </thead>
              <tbody>
                {temas.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f0f1f3" }}>
                    <td style={tdStyle}>{t.nombre}</td>
                    <td style={tdStyle}>
                      <span style={badgeEstilo("#e9ecef", "#495057")}>
                        {CATEGORIA_LABEL[t.categoria]}
                      </span>
                    </td>
                    <td style={tdStyle}>{t.horas ?? "—"}</td>
                    <td style={tdStyle}>
                      {t.periodicidad_meses ? `${t.periodicidad_meses} meses` : "Una sola vez"}
                    </td>
                  </tr>
                ))}
                {temas.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 16, color: "#808080" }}>
                      Todavía no hay temas registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Sesiones dictadas ({sesionesFiltradas.length})</strong>
              <button onClick={() => setMostrarFormSesion((v) => !v)} style={botonSecundarioEstilo}>
                {mostrarFormSesion ? "Cancelar" : "+ Registrar sesión"}
              </button>
            </div>
            {mostrarFormSesion && (
              <FormNuevaSesion
                temas={temas}
                onGuardado={() => {
                  setMostrarFormSesion(false);
                  cargarTodo();
                }}
              />
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e5eb" }}>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Tema</th>
                  <th style={thStyle}>Categoría</th>
                  <th style={thStyle}>Facilitador</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Asistentes</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {sesionesFiltradas.map((s) => {
                  const tema = temaPorId.get(s.tema_id);
                  const asistentes = (asistenciasPorSesion.get(s.id) ?? []).filter((a) => a.asistio).length;
                  return (
                    <Fragment key={s.id}>
                      <tr style={{ borderBottom: "1px solid #f0f1f3" }}>
                        <td style={tdStyle}>{s.fecha}</td>
                        <td style={tdStyle}>{tema?.nombre ?? "—"}</td>
                        <td style={tdStyle}>
                          {tema && <span style={badgeEstilo("#e9ecef", "#495057")}>{CATEGORIA_LABEL[tema.categoria]}</span>}
                        </td>
                        <td style={tdStyle}>{s.facilitador ?? "—"}</td>
                        <td style={tdStyle}>{s.tipo === "interna" ? "Interna" : "Externa"}</td>
                        <td style={tdStyle}>{asistentes}</td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => setSesionExpandidaId(sesionExpandidaId === s.id ? null : s.id)}
                            style={{ ...botonEstilo, padding: "4px 10px", fontSize: "0.85rem" }}
                          >
                            {sesionExpandidaId === s.id ? "Cerrar" : "Asistencia"}
                          </button>
                        </td>
                      </tr>
                      {sesionExpandidaId === s.id && (
                        <tr>
                          <td colSpan={7} style={{ background: "#f7f8fa", padding: 16 }}>
                            <AsistenciaSesion
                              sesion={s}
                              trabajadores={trabajadores}
                              registros={asistenciasPorSesion.get(s.id) ?? []}
                              onCambio={cargarTodo}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {sesionesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 16, color: "#808080" }}>
                      Ninguna sesión coincide con el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <strong>
              Cobertura por trabajador
              {filtroCategoria !== "todas" ? ` — ${CATEGORIA_LABEL[filtroCategoria]}` : " — todas las categorías"}
            </strong>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e5eb" }}>
                  <th style={thStyle}>Trabajador</th>
                  <th style={thStyle}>Sesiones asistidas</th>
                </tr>
              </thead>
              <tbody>
                {trabajadores.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f0f1f3" }}>
                    <td style={tdStyle}>
                      {t.nombres} {t.apellidos}
                    </td>
                    <td style={tdStyle}>{coberturaPorTrabajador.get(t.id) ?? 0}</td>
                  </tr>
                ))}
                {trabajadores.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: 16, color: "#808080" }}>
                      Todavía no hay trabajadores registrados en el expediente.
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

function FormNuevoTema({ onGuardado }: { onGuardado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaCapacitacion>("general");
  const [horas, setHoras] = useState("");
  const [periodicidad, setPeriodicidad] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!nombre) {
      setError("El nombre del tema es obligatorio.");
      return;
    }
    setGuardando(true);
    setError(null);

    const { data: empresas, error: empresaError } = await supabase
      .from("empresas")
      .select("id")
      .limit(1);

    if (empresaError || !empresas || empresas.length === 0) {
      setError("No se encontró la empresa. Verifique que el SQL inicial ya se ejecutó.");
      setGuardando(false);
      return;
    }

    const { error: insertError } = await supabase.from("temas_capacitacion").insert({
      empresa_id: empresas[0].id,
      nombre,
      categoria,
      horas: horas ? Number(horas) : null,
      periodicidad_meses: periodicidad ? Number(periodicidad) : null,
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
        Nombre del tema
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
      </label>
      <label>
        Categoría
        <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaCapacitacion)} style={inputStyle}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LABEL[c]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Horas
        <input type="number" value={horas} onChange={(e) => setHoras(e.target.value)} style={inputStyle} />
      </label>
      <label>
        Se repite cada (meses, dejar vacío si es una sola vez)
        <input type="number" value={periodicidad} onChange={(e) => setPeriodicidad(e.target.value)} style={inputStyle} />
      </label>
      <button onClick={guardar} disabled={guardando} style={botonEstilo}>
        {guardando ? "Guardando..." : "Guardar tema"}
      </button>
    </div>
  );
}

function FormNuevaSesion({
  temas,
  onGuardado,
}: {
  temas: TemaCapacitacion[];
  onGuardado: () => void;
}) {
  const [temaId, setTemaId] = useState("");
  const [fecha, setFecha] = useState("");
  const [facilitador, setFacilitador] = useState("");
  const [tipo, setTipo] = useState<"interna" | "externa">("interna");
  const [soporteUrl, setSoporteUrl] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (!temaId || !fecha) {
      setError("Elija el tema y la fecha de la sesión.");
      return;
    }
    setGuardando(true);
    setError(null);

    const { data: empresas, error: empresaError } = await supabase
      .from("empresas")
      .select("id")
      .limit(1);

    if (empresaError || !empresas || empresas.length === 0) {
      setError("No se encontró la empresa. Verifique que el SQL inicial ya se ejecutó.");
      setGuardando(false);
      return;
    }

    const { error: insertError } = await supabase.from("sesiones_capacitacion").insert({
      empresa_id: empresas[0].id,
      tema_id: temaId,
      fecha,
      facilitador: facilitador || null,
      tipo,
      soporte_url: soporteUrl || null,
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
        Tema
        <select value={temaId} onChange={(e) => setTemaId(e.target.value)} style={inputStyle}>
          <option value="">— Elegir —</option>
          {temas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} ({CATEGORIA_LABEL[t.categoria]})
            </option>
          ))}
        </select>
      </label>
      <label>
        Fecha
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
      </label>
      <label>
        Facilitador
        <input value={facilitador} onChange={(e) => setFacilitador(e.target.value)} style={inputStyle} />
      </label>
      <label>
        Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value as "interna" | "externa")} style={inputStyle}>
          <option value="interna">Interna</option>
          <option value="externa">Externa</option>
        </select>
      </label>
      <label>
        Enlace al acta o soporte (opcional)
        <input value={soporteUrl} onChange={(e) => setSoporteUrl(e.target.value)} style={inputStyle} />
      </label>
      <button onClick={guardar} disabled={guardando} style={botonEstilo}>
        {guardando ? "Guardando..." : "Guardar sesión"}
      </button>
    </div>
  );
}

function AsistenciaSesion({
  sesion,
  trabajadores,
  registros,
  onCambio,
}: {
  sesion: SesionCapacitacion;
  trabajadores: Trabajador[];
  registros: AsistenciaCapacitacion[];
  onCambio: () => void;
}) {
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const registroPorTrabajador = useMemo(() => {
    const m = new Map<string, AsistenciaCapacitacion>();
    registros.forEach((r) => m.set(r.trabajador_id, r));
    return m;
  }, [registros]);

  async function alternar(trabajadorId: string, asistioActual: boolean | undefined) {
    setGuardandoId(trabajadorId);
    setError(null);
    const nuevoValor = !asistioActual;
    const { error: upsertError } = await supabase
      .from("asistencia_capacitacion")
      .upsert(
        { sesion_id: sesion.id, trabajador_id: trabajadorId, asistio: nuevoValor },
        { onConflict: "sesion_id,trabajador_id" }
      );
    setGuardandoId(null);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    onCambio();
  }

  return (
    <div>
      <strong>Asistencia — {sesion.fecha}</strong>
      {error && <p style={{ color: "#c00000" }}>{error}</p>}
      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        {trabajadores.map((t) => {
          const registro = registroPorTrabajador.get(t.id);
          const asistio = registro?.asistio ?? false;
          return (
            <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={asistio}
                disabled={guardandoId === t.id}
                onChange={() => alternar(t.id, asistio)}
              />
              {t.nombres} {t.apellidos}
            </label>
          );
        })}
        {trabajadores.length === 0 && (
          <p style={{ color: "#808080" }}>Todavía no hay trabajadores registrados en el expediente.</p>
        )}
      </div>
    </div>
  );
}
