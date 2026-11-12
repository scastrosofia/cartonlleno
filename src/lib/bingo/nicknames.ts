/**
 * Verifica si un apodo ya está en uso en la juntada (ignorando mayúsculas y espacios extras).
 * Si está en uso, sugiere una alternativa agregando el número siguiente (ej: "Juan 2").
 */
export function desduplicarApodo(nombre: string, nombresExistentes: string[]): { disponible: boolean; sugerencia: string } {
  const normalizado = nombre.trim();
  if (!normalizado) {
    return { disponible: false, sugerencia: 'Jugador 1' };
  }

  const enUso = nombresExistentes.some(
    existente => existente.trim().toLowerCase() === normalizado.toLowerCase()
  );

  if (!enUso) {
    return { disponible: true, sugerencia: normalizado };
  }

  // Si ya tiene un número al final (ej: "Tío 2"), extraemos la base
  const match = normalizado.match(/^(.*?)(?:\s+(\d+))?$/);
  const base = match && match[1] ? match[1].trim() : normalizado;

  let counter = 2;
  while (true) {
    const candidata = `${base} ${counter}`;
    const ocupado = nombresExistentes.some(
      existente => existente.trim().toLowerCase() === candidata.toLowerCase()
    );
    if (!ocupado) {
      return { disponible: false, sugerencia: candidata };
    }
    counter++;
  }
}
