const supabaseConfigurado =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const modulos = [
  {
    nombre: "Núcleo",
    detalle: "Empresas, cargos, usuarios y roles — base multiempresa",
  },
  {
    nombre: "Expediente del trabajador",
    detalle: "Registro único por persona: datos, cargo, competencias críticas",
  },
  {
    nombre: "Capacitación",
    detalle: "Plan anual único, transversal a todos los riesgos y comités",
  },
  {
    nombre: "Comités",
    detalle: "COPASST y Comité de Convivencia — conformación y seguimiento",
  },
];

export default function Home() {
  return (
    <main className="page">
      <h1>Talento Vivetel</h1>
      <p>
        Esqueleto inicial del proyecto. Esta pantalla confirma que la app
        corre y que la conexión con Supabase está (o no) configurada.
      </p>

      <div className="card">
        <strong>Estado de Supabase: </strong>
        {supabaseConfigurado ? (
          <span className="badge" style={{ background: "#e2efda", color: "#1e7145" }}>
            Configurado
          </span>
        ) : (
          <span className="badge">Pendiente — complete .env.local</span>
        )}
      </div>

      <div className="card">
        <strong>Bloque inicial (Fase 3)</strong>
        <ul>
          {modulos.map((m) => (
            <li key={m.nombre}>
              <strong>{m.nombre}:</strong> {m.detalle}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <strong>Ya disponible</strong>
        <p style={{ margin: "8px 0" }}>
          <a href="/expediente" style={{ color: "#2e5395", fontWeight: "bold" }}>
            → Ir al expediente del trabajador
          </a>
        </p>
        <p style={{ margin: "8px 0" }}>
          <a href="/capacitacion" style={{ color: "#2e5395", fontWeight: "bold" }}>
            → Ir al plan de capacitación
          </a>
        </p>
      </div>
    </main>
  );
}
