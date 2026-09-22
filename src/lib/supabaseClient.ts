// Cliente único de Supabase para toda la app.
// Lee la URL y la llave pública desde las variables de entorno (.env.local).
// Este archivo no contiene ninguna clave: solo las referencia.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Este aviso solo aparece en la consola del navegador durante el desarrollo,
  // mientras falte configurar el archivo .env.local con los datos de Supabase.
  console.warn(
    "Faltan las variables NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copie .env.example como .env.local y complete los datos de su proyecto de Supabase."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
