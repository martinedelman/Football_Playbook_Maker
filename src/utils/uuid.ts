// Helper para generar UUIDs en el navegador y Node.js
export function generateUUID(): string {
  // Intenta usar crypto.randomUUID si está disponible (navegadores modernos)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: implementación compatible con navegadores antiguos
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
