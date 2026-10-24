# 🏁 Parrilla

Liga de karting entre amigos: cargás cada fecha y la tabla del campeonato se arma sola.
Más adelante: prode de F1 y carga de resultados con una foto de la planilla.

Stack: Next.js 16 · Supabase (Auth + Postgres + RLS) · Tailwind · Vercel.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto en Supabase** (supabase.com → New project).
   El plan gratis permite 2 proyectos activos: si ya tenés 2, pausá uno.
2. **Crear las tablas:** Supabase → SQL Editor → pegá todo [`supabase/migrations/0001_liga.sql`](supabase/migrations/0001_liga.sql) → Run.
   Después lo mismo con [`0002_prode.sql`](supabase/migrations/0002_prode.sql) (prode de F1, trae el calendario 2026).
   Cada temporada nueva: `node scripts/prode-calendar.mjs 2027` y pegá lo que imprime en el SQL Editor.
3. **Variables de entorno:** copiá `.env.example` como `.env.local` y completá
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API).
4. **URLs de Auth:** Authentication → URL Configuration
   - Site URL: `http://localhost:3000` (después, tu dominio de Vercel)
   - Redirect URLs: `http://localhost:3000/**` y `https://TU-DOMINIO/**`
5. **Mail de inicio de sesión:** Authentication → Emails → *Magic Link* → reemplazá el contenido por:

   ```html
   <h2>Tu código para entrar a Parrilla</h2>
   <p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
   <p>O tocá este link: <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Entrar a Parrilla</a></p>
   ```

   Así funciona con el código **o** con el link, aunque abras el mail en otro navegador.
6. **SMTP propio (antes de que lo use otra gente):** el mail de Supabase por defecto solo llega a los
   miembros de tu equipo de Supabase y tiene un límite muy bajo por hora. Configurá Resend:
   Project Settings → Authentication → SMTP Settings (host `smtp.resend.com`, puerto 465,
   usuario `resend`, contraseña = tu API key de Resend).

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # tests de la tabla, los tiempos de vuelta y los puntos del prode
npm run test:sql  # corre las migraciones en un Postgres en memoria y prueba los permisos (RLS)
npm run build
```

> En PowerShell de esta compu `npm` está bloqueado por la política de scripts: usá `npm.cmd run dev`.
>
> En esta red `registry.npmjs.org` no responde, por eso `.npmrc` usa el mirror `registry.yarnpkg.com`
> (mismos paquetes). Si en otra red npm anda bien, podés borrar `.npmrc`.

## Cómo está armado

- `supabase/migrations/` — tablas, permisos (RLS) y funciones (`join_league`, `claim_driver`, `save_event`, `public_league`).
- `src/lib/standings.ts` — cálculo del campeonato (puntos, vuelta rápida, desempates estilo F1).
- `src/lib/driver-profile.ts` — estadísticas de cada piloto y duelos cara a cara.
- `src/lib/og/` — imágenes para compartir (vista previa de WhatsApp, historias, ícono de la app).
- `src/app/ligas/` — pantallas para miembros (requieren login).
- `src/app/l/[code]/` — tabla pública y resultado de cada fecha, para compartir por WhatsApp.
  - `opengraph-image.tsx` — la imagen que aparece al pegar el link.
  - `f/[eventId]/historia` — imagen vertical 1080×1920 para historias.
