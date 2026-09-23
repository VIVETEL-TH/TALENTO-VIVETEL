# Talento Vivetel

App de Talento Humano con SST integrada — Vivetel Telecomunicaciones.

## Qué es este esqueleto

Es el punto de partida técnico del proyecto: una app en Next.js conectada a
Supabase (base de datos, usuarios y archivos). Por ahora solo muestra una
pantalla de estado; los módulos reales (expediente del trabajador,
capacitación, comités) se construyen sobre esta base en la Fase 3.

## Despliegue

Publicado en Vercel, conectado a este repositorio (rama `main`). Cada
cambio subido aquí se construye y publica automáticamente.

## Cómo dejarla funcionando en su computador (opcional, solo si quiere verla)

No es necesario hacer esto para que el proyecto avance — el equipo sigue
entregando código sobre este mismo esqueleto. Es solo si usted quiere ver la
pantalla localmente antes de que esté publicada en internet.

1. Instale [Node.js](https://nodejs.org) (versión 18 o superior), si no lo tiene.
2. Copie `.env.example` como `.env.local` y complete las dos líneas con los
   datos de su proyecto de Supabase (Project Settings → API).
3. Abra una terminal en esta carpeta y ejecute:
   ```
   npm install
   npm run dev
   ```
4. Abra `http://localhost:3000` en el navegador.

## Estructura

```
src/
  app/            Páginas de la aplicación (Next.js App Router)
  lib/
    supabaseClient.ts   Conexión única a Supabase, usada por toda la app
```

## Convención de commits

Al subir cambios desde GitHub Desktop, use un resumen corto que diga qué
módulo cambió, por ejemplo: `Agrega expediente del trabajador` o
`Ajusta plan de capacitación`. El equipo del proyecto irá indicando el texto
exacto en cada entrega.
