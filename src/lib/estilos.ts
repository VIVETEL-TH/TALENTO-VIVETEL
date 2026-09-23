// Estilos compartidos entre los módulos de la app, para que todas las
// pantallas (expediente, capacitación, comités, etc.) se vean iguales
// sin repetir el mismo código en cada archivo.
import type { CSSProperties } from "react";

export const thStyle: CSSProperties = { padding: "8px 6px", fontSize: "0.85rem", color: "#555" };
export const tdStyle: CSSProperties = { padding: "8px 6px" };

export const botonEstilo: CSSProperties = {
  background: "#1f3864",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
  fontFamily: "Arial, sans-serif",
};

export const botonSecundarioEstilo: CSSProperties = {
  ...botonEstilo,
  background: "#fff",
  color: "#1f3864",
  border: "1px solid #1f3864",
};

export const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid #e2e5eb",
  borderRadius: 6,
  fontFamily: "Arial, sans-serif",
};

export function badgeEstilo(bg: string, fg: string): CSSProperties {
  return {
    background: bg,
    color: fg,
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: "0.8rem",
    fontWeight: "bold",
  };
}
