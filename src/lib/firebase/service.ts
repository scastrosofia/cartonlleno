import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { Juntada, Clasico, Jugador, Carton, TipoJuntada, FormatoCarton, ModoJuego, TipoJugador } from '@/types';
import { prepararPoolClasicos, generarCarton } from '../bingo/generator';
import { getBancoCompletoParaTipo } from '@/data/bancoClasicos';

// --- BROADCAST CHANNEL PARA MODO LOCAL REACTIVO MULTI-TAB ---
const localChannel =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('carton_lleno_bus')
    : null;

function broadcastLocalEvent(type: string, payload: any) {
  if (localChannel) {
    localChannel.postMessage({ type, payload });
  }
}

// Helper para guardar / cargar en localStorage cuando no hay credenciales de Firebase
function getLocalDB(): {
  juntadas: Record<string, Juntada>;
  clasicos: Record<string, Clasico[]>;
  jugadores: Record<string, Jugador[]>;
  cartones: Record<string, Carton[]>;
} {
  if (typeof window === 'undefined') {
    return { juntadas: {}, clasicos: {}, jugadores: {}, cartones: {} };
  }
  const raw = localStorage.getItem('carton_lleno_mock_db');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return { juntadas: {}, clasicos: {}, jugadores: {}, cartones: {} };
}

function saveLocalDB(data: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('carton_lleno_mock_db', JSON.stringify(data));
}

// ----------------------------------------------------------------------
// SERVICIO DE JUNTADAS
// ----------------------------------------------------------------------

export async function createJuntada(params: {
  nombre: string;
  tipo: TipoJuntada;
  fecha: string;
  formato: FormatoCarton;
  modo: ModoJuego;
  premio: string;
  hostUid: string;
}): Promise<Juntada> {
  const cleanSlug = params.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 30) || 'juntada';

  // Código corto tipo "TIA24" o 5 letras aleatorias
  const codigoRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const codigo = `${codigoRandom}${yearSuffix}`;

  const juntadaId = `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const slug = `${cleanSlug}-${Math.random().toString(36).substring(2, 5)}`;

  const juntada: Juntada = {
    id: juntadaId,
    nombre: params.nombre,
    tipo: params.tipo,
    fecha: params.fecha,
    formato: params.formato,
    modo: params.modo,
    premio: params.premio || 'El que gana no lava los platos',
    codigo,
    slug,
    hostUid: params.hostUid,
    estado: 'cargando',
    creadaEn: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'juntadas', juntadaId);
    await setDoc(docRef, juntada);
  } else {
    const local = getLocalDB();
    local.juntadas[juntadaId] = juntada;
    local.clasicos[juntadaId] = [];
    local.jugadores[juntadaId] = [];
    local.cartones[juntadaId] = [];
    saveLocalDB(local);
    broadcastLocalEvent('JUNTADA_UPDATED', juntada);
  }

  return juntada;
}

export async function getJuntadaBySlug(slug: string): Promise<Juntada | null> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'juntadas'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Juntada;
    }
  } else {
    const local = getLocalDB();
    const found = Object.values(local.juntadas).find(j => j.slug === slug);
    if (found) return found;
  }
  return null;
}

export async function getJuntadaByCodigo(codigo: string): Promise<Juntada | null> {
  const cleanCode = codigo.trim().toUpperCase();
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'juntadas'), where('codigo', '==', cleanCode));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Juntada;
    }
  } else {
    const local = getLocalDB();
    const found = Object.values(local.juntadas).find(j => j.codigo.toUpperCase() === cleanCode);
    if (found) return found;
  }
  return null;
}

export function subscribeToJuntada(juntadaId: string, callback: (juntada: Juntada | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'juntadas', juntadaId);
    return onSnapshot(docRef, snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Juntada);
      } else {
        callback(null);
      }
    });
  }

  // Local fallback
  const refresh = () => {
    const local = getLocalDB();
    callback(local.juntadas[juntadaId] || null);
  };
  refresh();

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'JUNTADA_UPDATED' && event.data?.payload?.id === juntadaId) {
      callback(event.data.payload);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'carton_lleno_mock_db') refresh();
  };

  if (localChannel) localChannel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (localChannel) localChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

// ----------------------------------------------------------------------
// CLÁSICOS (ANÓNIMOS)
// ----------------------------------------------------------------------

export async function addClasico(juntadaId: string, texto: string): Promise<Clasico> {
  const cleanTexto = texto.trim();
  const id = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const clasico: Clasico = {
    id,
    texto: cleanTexto,
    creadoEn: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'juntadas', juntadaId, 'clasicos', id);
    await setDoc(docRef, clasico);
  } else {
    const local = getLocalDB();
    if (!local.clasicos[juntadaId]) local.clasicos[juntadaId] = [];
    local.clasicos[juntadaId].push(clasico);
    saveLocalDB(local);
    broadcastLocalEvent('CLASICOS_UPDATED', { juntadaId, clasicos: local.clasicos[juntadaId] });
  }

  return clasico;
}

export async function removeClasico(juntadaId: string, clasicoId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'juntadas', juntadaId, 'clasicos', clasicoId);
    await deleteDoc(docRef);
  } else {
    const local = getLocalDB();
    if (local.clasicos[juntadaId]) {
      local.clasicos[juntadaId] = local.clasicos[juntadaId].filter(c => c.id !== clasicoId);
      saveLocalDB(local);
      broadcastLocalEvent('CLASICOS_UPDATED', { juntadaId, clasicos: local.clasicos[juntadaId] });
    }
  }
}

export function subscribeToClasicos(juntadaId: string, callback: (clasicos: Clasico[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const colRef = collection(db, 'juntadas', juntadaId, 'clasicos');
    return onSnapshot(colRef, snapshot => {
      const list: Clasico[] = [];
      snapshot.forEach(d => list.push(d.data() as Clasico));
      list.sort((a, b) => a.creadoEn - b.creadoEn);
      callback(list);
    });
  }

  const refresh = () => {
    const local = getLocalDB();
    callback(local.clasicos[juntadaId] || []);
  };
  refresh();

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'CLASICOS_UPDATED' && event.data?.payload?.juntadaId === juntadaId) {
      callback(event.data.payload.clasicos);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'carton_lleno_mock_db') refresh();
  };

  if (localChannel) localChannel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (localChannel) localChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

// ----------------------------------------------------------------------
// JUGADORES
// ----------------------------------------------------------------------

export async function addJugador(
  juntadaId: string,
  nombre: string,
  uid: string | null,
  tipo: TipoJugador = 'celu',
  padrinoUid?: string | null
): Promise<Jugador> {
  const cleanNombre = nombre.trim();
  const id = `juga_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const jugador: Jugador = {
    id,
    nombre: cleanNombre,
    uid,
    tipo,
    padrinoUid,
    creadoEn: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'juntadas', juntadaId, 'jugadores', id);
    await setDoc(docRef, jugador);
  } else {
    const local = getLocalDB();
    if (!local.jugadores[juntadaId]) local.jugadores[juntadaId] = [];
    local.jugadores[juntadaId].push(jugador);
    saveLocalDB(local);
    broadcastLocalEvent('JUGADORES_UPDATED', { juntadaId, jugadores: local.jugadores[juntadaId] });
  }

  return jugador;
}

export function subscribeToJugadores(juntadaId: string, callback: (jugadores: Jugador[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const colRef = collection(db, 'juntadas', juntadaId, 'jugadores');
    return onSnapshot(colRef, snapshot => {
      const list: Jugador[] = [];
      snapshot.forEach(d => list.push(d.data() as Jugador));
      list.sort((a, b) => a.creadoEn - b.creadoEn);
      callback(list);
    });
  }

  const refresh = () => {
    const local = getLocalDB();
    callback(local.jugadores[juntadaId] || []);
  };
  refresh();

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'JUGADORES_UPDATED' && event.data?.payload?.juntadaId === juntadaId) {
      callback(event.data.payload.jugadores);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'carton_lleno_mock_db') refresh();
  };

  if (localChannel) localChannel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (localChannel) localChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

// ----------------------------------------------------------------------
// REPARTIR CARTONES & INICIAR JUEGO
// ----------------------------------------------------------------------

export async function repartirCartones(juntadaId: string): Promise<Carton[]> {
  let juntada: Juntada | null = null;
  let clasicos: Clasico[] = [];
  let jugadores: Jugador[] = [];

  if (isFirebaseConfigured && db) {
    const jDoc = await getDoc(doc(db, 'juntadas', juntadaId));
    if (jDoc.exists()) juntada = jDoc.data() as Juntada;

    const cSnap = await getDocs(collection(db, 'juntadas', juntadaId, 'clasicos'));
    clasicos = cSnap.docs.map(d => d.data() as Clasico);

    const jSnap = await getDocs(collection(db, 'juntadas', juntadaId, 'jugadores'));
    jugadores = jSnap.docs.map(d => d.data() as Jugador);
  } else {
    const local = getLocalDB();
    juntada = local.juntadas[juntadaId] || null;
    clasicos = local.clasicos[juntadaId] || [];
    jugadores = local.jugadores[juntadaId] || [];
  }

  if (!juntada) throw new Error('Juntada no encontrada');

  const { pool } = prepararPoolClasicos(clasicos, juntada.formato, juntada.tipo);

  const cartones: Carton[] = [];
  jugadores.forEach((jugador, index) => {
    const carton = generarCarton(
      juntadaId,
      jugador.id,
      jugador.nombre,
      index + 1,
      pool,
      juntada!.formato,
      cartones
    );
    cartones.push(carton);
  });

  if (isFirebaseConfigured && db) {
    // Guardamos cartones y pasamos juntada a 'jugando'
    for (const carton of cartones) {
      await setDoc(doc(db, 'juntadas', juntadaId, 'cartones', carton.id), carton);
    }
    await updateDoc(doc(db, 'juntadas', juntadaId), { estado: 'jugando' });
  } else {
    const local = getLocalDB();
    local.cartones[juntadaId] = cartones;
    if (local.juntadas[juntadaId]) {
      local.juntadas[juntadaId].estado = 'jugando';
    }
    saveLocalDB(local);
    broadcastLocalEvent('CARTONES_UPDATED', { juntadaId, cartones });
    broadcastLocalEvent('JUNTADA_UPDATED', local.juntadas[juntadaId]);
  }

  return cartones;
}

// ----------------------------------------------------------------------
// CARTONES & JUEGO EN VIVO
// ----------------------------------------------------------------------

export function subscribeToCarton(
  juntadaId: string,
  jugadorId: string,
  callback: (carton: Carton | null) => void
): () => void {
  const cartonId = `carton_${jugadorId}`;

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'juntadas', juntadaId, 'cartones', cartonId);
    return onSnapshot(docRef, snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Carton);
      } else {
        callback(null);
      }
    });
  }

  const refresh = () => {
    const local = getLocalDB();
    const list = local.cartones[juntadaId] || [];
    const found = list.find(c => c.jugadorId === jugadorId) || null;
    callback(found);
  };
  refresh();

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'CARTONES_UPDATED' && event.data?.payload?.juntadaId === juntadaId) {
      const list: Carton[] = event.data.payload.cartones || [];
      const found = list.find(c => c.jugadorId === jugadorId) || null;
      callback(found);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'carton_lleno_mock_db') refresh();
  };

  if (localChannel) localChannel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (localChannel) localChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export function subscribeToAllCartones(
  juntadaId: string,
  callback: (cartones: Carton[]) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const colRef = collection(db, 'juntadas', juntadaId, 'cartones');
    return onSnapshot(colRef, snapshot => {
      const list: Carton[] = [];
      snapshot.forEach(d => list.push(d.data() as Carton));
      callback(list);
    });
  }

  const refresh = () => {
    const local = getLocalDB();
    callback(local.cartones[juntadaId] || []);
  };
  refresh();

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'CARTONES_UPDATED' && event.data?.payload?.juntadaId === juntadaId) {
      callback(event.data.payload.cartones || []);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'carton_lleno_mock_db') refresh();
  };

  if (localChannel) localChannel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (localChannel) localChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function toggleMarcarCasillero(
  juntadaId: string,
  cartonId: string,
  index: number
): Promise<number[]> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'juntadas', juntadaId, 'cartones', cartonId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return [];

    const carton = snap.data() as Carton;
    let marcados = [...carton.marcados];

    if (marcados.includes(index)) {
      // Si no es el libre, lo desmarcamos
      if (!carton.casilleros[index]?.esLibre) {
        marcados = marcados.filter(i => i !== index);
      }
    } else {
      marcados.push(index);
    }

    await updateDoc(docRef, { marcados });
    return marcados;
  }

  // Local
  const local = getLocalDB();
  const list = local.cartones[juntadaId] || [];
  const idx = list.findIndex(c => c.id === cartonId);
  if (idx !== -1) {
    const carton = list[idx];
    let marcados = [...carton.marcados];
    if (marcados.includes(index)) {
      if (!carton.casilleros[index]?.esLibre) {
        marcados = marcados.filter(i => i !== index);
      }
    } else {
      marcados.push(index);
    }
    carton.marcados = marcados;
    saveLocalDB(local);
    broadcastLocalEvent('CARTONES_UPDATED', { juntadaId, cartones: local.cartones[juntadaId] });
    return marcados;
  }

  return [];
}

export async function cantarVictoria(
  juntadaId: string,
  cartonId: string,
  jugadorId: string,
  jugadorNombre: string,
  tipo: 'linea' | 'lleno'
): Promise<void> {
  const horaNow = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const ganadorInfo = {
    jugadorId,
    nombre: jugadorNombre,
    hora: horaNow,
    tipo,
  };

  const updateFields = tipo === 'linea'
    ? { ganadorLinea: ganadorInfo }
    : { ganadorLleno: ganadorInfo, estado: 'terminada' };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'juntadas', juntadaId), updateFields);
    await updateDoc(doc(db, 'juntadas', juntadaId, 'cartones', cartonId), {
      [tipo === 'linea' ? 'ganoLineaAt' : 'ganoLlenoAt']: horaNow,
    });
  } else {
    const local = getLocalDB();
    if (local.juntadas[juntadaId]) {
      Object.assign(local.juntadas[juntadaId], updateFields);
    }
    const cList = local.cartones[juntadaId] || [];
    const c = cList.find(x => x.id === cartonId);
    if (c) {
      if (tipo === 'linea') c.ganoLineaAt = horaNow;
      if (tipo === 'lleno') c.ganoLlenoAt = horaNow;
    }
    saveLocalDB(local);
    broadcastLocalEvent('JUNTADA_UPDATED', local.juntadas[juntadaId]);
    broadcastLocalEvent('CARTONES_UPDATED', { juntadaId, cartones: local.cartones[juntadaId] });
  }
}
