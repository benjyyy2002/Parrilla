import type { MetadataRoute } from "next";

// Permite "Agregar a la pantalla de inicio" y abrir Parrilla como una app, sin barra del navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parrilla · Tu liga de karting",
    short_name: "Parrilla",
    description: "Armá el campeonato de karting con tus amigos.",
    lang: "es-AR",
    start_url: "/ligas",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
