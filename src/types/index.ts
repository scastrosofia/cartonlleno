export type TipoJuntada = 'familia' | 'amigos' | 'oficina' | 'otra';
export type FormatoCarton = '3x3' | '4x4' | '5x5';
export type ModoJuego = 'vivo' | 'tradicional';
export type EstadoJuntada = 'cargando' | 'jugando' | 'terminada';
export type TipoJugador = 'celu' | 'impreso' | 'apadrinado';

export interface Clasico {
  id: string;
  texto: string;
  creadoEn: number;
}

export interface Jugador {
  id: string;
  nombre: string;
  uid: string | null;
  tipo: TipoJugador;
  padrinoUid?: string | null;
  creadoEn: number;
}

export interface Casillero {
  id: string;
  texto: string;
  esLibre?: boolean; // Para centro libre en 5x5
}

export interface Carton {
  id: string;
  juntadaId: string;
  jugadorId: string;
  jugadorNombre: string;
  numero: number;
  casilleros: Casillero[];
  marcados: number[]; // índices de los casilleros marcados
  ganoLineaAt?: string | null;
  ganoLlenoAt?: string | null;
}

export interface GanadorInfo {
  jugadorId: string;
  nombre: string;
  hora: string;
  tipo: 'linea' | 'lleno';
}

export interface Juntada {
  id: string;
  nombre: string;
  tipo: TipoJuntada;
  fecha: string;
  formato: FormatoCarton;
  modo: ModoJuego;
  premio: string;
  codigo: string;
  slug: string;
  hostUid: string;
  estado: EstadoJuntada;
  creadaEn: number;
  ganadorLinea?: GanadorInfo | null;
  ganadorLleno?: GanadorInfo | null;
}
