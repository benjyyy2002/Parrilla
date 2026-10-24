import { renderAppIcon } from "@/lib/og/app-icon";

// Genera /icon/32 (pestaña del navegador), /icon/192 y /icon/512 (app instalada).
export function generateImageMetadata() {
  return [32, 192, 512].map((px) => ({
    id: String(px),
    size: { width: px, height: px },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return renderAppIcon(Number(await id));
}
