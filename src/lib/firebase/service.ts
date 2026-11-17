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
import { Juntada, Clasico, Jugador, Carton, TipoJuntada, FormatoCarton, ModoJuego, TipoJugador, GanadorInfo } from '@/types';
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

  // Guardar siempre en localDB para reactividad instantánea y fallback offline
  const local = getLocalDB();
  local.juntadas[juntadaId] = juntada;
  local.clasicos[juntadaId] = [];
  local.jugadores[juntadaId] = [];
  local.cartones[juntadaId] = [];
  saveLocalDB(local);
  broadcastLocalEvent('JUNTADA_UPDATED', juntada);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntadaId);
      await setDoc(docRef, juntada);
    } catch (err) {
      console.warn('Error al guardar juntada en Firestore, usando almacenamiento local:', err);
    }
  }

  return juntada;
}

export async function getJuntadaById(juntadaId: string): Promise<Juntada | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntadaId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as Juntada;
      }
    } catch (err) {
      console.warn('Error en getJuntadaById Firestore:', err);
    }
  }
  const local = getLocalDB();
  return local.juntadas[juntadaId] || null;
}

export async function getJuntadaBySlug(slug: string): Promise<Juntada | null> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'juntadas'), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Juntada;
      }
    } catch (err) {
      console.warn('Error en getJuntadaBySlug Firestore:', err);
    }
  }
  const local = getLocalDB();
  const found = Object.values(local.juntadas).find(j => j.slug === slug);
  if (found) return found;
  return null;
}

export async function getJuntadaByCodigo(codigo: string): Promise<Juntada | null> {
  const cleanCode = codigo.trim().toUpperCase();
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'juntadas'), where('codigo', '==', cleanCode));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Juntada;
      }
    } catch (err) {
      console.warn('Error en getJuntadaByCodigo Firestore:', err);
    }
  }
  const local = getLocalDB();
  const found = Object.values(local.juntadas).find(j => j.codigo.toUpperCase() === cleanCode);
  if (found) return found;
  return null;
}

export function subscribeToJuntada(juntadaId: string, callback: (juntada: Juntada | null) => void): () => void {
  let unsubFirestore: (() => void) | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntadaId);
      unsubFirestore = onSnapshot(
        docRef,
        snapshot => {
          if (snapshot.exists()) {
            callback(snapshot.data() as Juntada);
          } else {
            const local = getLocalDB();
            callback(local.juntadas[juntadaId] || null);
          }
        },
        error => {
          console.warn('Firestore onSnapshot juntada error, fallback local:', error);
          const local = getLocalDB();
          callback(local.juntadas[juntadaId] || null);
        }
      );
    } catch (err) {
      console.warn('Error al suscribir Firestore juntada:', err);
    }
  }

  // Local fallback
  const refresh = () => {
    const local = getLocalDB();
    if (local.juntadas[juntadaId]) {
      callback(local.juntadas[juntadaId]);
    }
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
    if (unsubFirestore) unsubFirestore();
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

  const local = getLocalDB();
  if (!local.clasicos[juntadaId]) local.clasicos[juntadaId] = [];
  local.clasicos[juntadaId].push(clasico);
  saveLocalDB(local);
  broadcastLocalEvent('CLASICOS_UPDATED', { juntadaId, clasicos: local.clasicos[juntadaId] });

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntadaId, 'clasicos', id);
      await setDoc(docRef, clasico);
    } catch (err) {
      console.warn('Error al guardar clasico en Firestore:', err);
    }
  }

  return clasico;
}

export async function removeClasico(juntadaId: string, clasicoId: string): Promise<void> {
  const local = getLocalDB();
  if (local.clasicos[juntadaId]) {
    local.clasicos[juntadaId] = local.clasicos[juntadaId].filter(c => c.id !== clasicoId);
    saveLocalDB(local);
    broadcastLocalEvent('CLASICOS_UPDATED', { juntadaId, clasicos: local.clasicos[juntadaId] });
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntadaId, 'clasicos', clasicoId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Error al eliminar clasico en Firestore:', err);
    }
  }
}

export function subscribeToClasicos(juntadaId: string, callback: (clasicos: Clasico[]) => void): () => void {
  let unsubFirestore: (() => void) | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'juntadas', juntadaId, 'clasicos');
      unsubFirestore = onSnapshot(
        colRef,
        snapshot => {
          const list: Clasico[] = [];
          snapshot.forEach(d => list.push(d.data() as Clasico));
          list.sort((a, b) => a.creadoEn - b.creadoEn);
          callback(list);
        },
        error => {
          console.warn('Firestore onSnapshot clasicos error, fallback local:', error);
          const local = getLocalDB();
          callback(local.clasicos[juntadaId] || []);
        }
      );
    } catch (err) {
      console.warn('Error al suscribir clasicos Firestore:', err);
    }
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
    if (unsubFirestore) unsubFirestore();
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

  const local = getLocalDB();
  if (!local.jugadores[juntadaId]) local.jugadores[juntadaId] = [];
  local.jugadores[juntadaId].push(jugador);
  saveLocalDB(local);
  broadcastLocalEvent('JUGADORES_UPDATED', { juntadaId, jugadores: local.jugadores[juntadaId] });

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntadaId, 'jugadores', id);
      await setDoc(docRef, jugador);
    } catch (err) {
      console.warn('Error al guardar jugador en Firestore:', err);
    }
  }

  return jugador;
}

export function subscribeToJugadores(juntadaId: string, callback: (jugadores: Jugador[]) => void): () => void {
  let unsubFirestore: (() => void) | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'juntadas', juntadaId, 'jugadores');
      unsubFirestore = onSnapshot(
        colRef,
        snapshot => {
          const list: Jugador[] = [];
          snapshot.forEach(d => list.push(d.data() as Jugador));
          list.sort((a, b) => a.creadoEn - b.creadoEn);
          callback(list);
        },
        error => {
          console.warn('Firestore onSnapshot jugadores error, fallback local:', error);
          const local = getLocalDB();
          callback(local.jugadores[juntadaId] || []);
        }
      );
    } catch (err) {
      console.warn('Error al suscribir jugadores Firestore:', err);
    }
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
    if (unsubFirestore) unsubFirestore();
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

  if (jugadores.length === 0) {
    const hostJugador: Jugador = {
      id: `juga_${Date.now()}_host`,
      nombre: 'Organizador',
      uid: juntada.hostUid,
      tipo: 'celu',
      creadoEn: Date.now(),
    };
    jugadores.push(hostJugador);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'juntadas', juntadaId, 'jugadores', hostJugador.id), hostJugador);
      } catch {}
    }
  }

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

  // Guardar siempre en localDB
  const local = getLocalDB();
  local.cartones[juntadaId] = cartones;
  if (local.juntadas[juntadaId]) {
    local.juntadas[juntadaId].estado = 'jugando';
  }
  saveLocalDB(local);
  broadcastLocalEvent('CARTONES_UPDATED', { juntadaId, cartones });
  broadcastLocalEvent('JUNTADA_UPDATED', local.juntadas[juntadaId]);

  if (isFirebaseConfigured && db) {
    try {
      for (const carton of cartones) {
        await setDoc(doc(db, 'juntadas', juntadaId, 'cartones', carton.id), carton);
      }
      await updateDoc(doc(db, 'juntadas', juntadaId), { estado: 'jugando' });
    } catch (err) {
      console.warn('Error al guardar cartones en Firestore:', err);
    }
  }

  return cartones;
}

/**
 * Obtiene el cartón asignado a un jugador o lo genera automáticamente al vuelo si aún no existe
 */
export async function obtenerOGenerarCarton(
  juntada: Juntada,
  jugadorId: string,
  jugadorNombre: string
): Promise<Carton> {
  const cartonId = `carton_${jugadorId}`;

  // 1. Verificar si ya existe en Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntada.id, 'cartones', cartonId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Carton;
      }
    } catch (err) {
      console.warn('Error al buscar cartón en Firestore:', err);
    }
  }

  // 2. Verificar si existe en localDB
  const local = getLocalDB();
  const list = local.cartones[juntada.id] || [];
  const existing = list.find(c => c.jugadorId === jugadorId || c.id === cartonId);
  if (existing) return existing;

  // 3. Si no existe, obtener clásicos y generar cartón al vuelo
  let clasicos: Clasico[] = [];
  if (isFirebaseConfigured && db) {
    try {
      const cSnap = await getDocs(collection(db, 'juntadas', juntada.id, 'clasicos'));
      clasicos = cSnap.docs.map(d => d.data() as Clasico);
    } catch {}
  }
  if (clasicos.length === 0) {
    clasicos = local.clasicos[juntada.id] || [];
  }

  const { pool } = prepararPoolClasicos(clasicos, juntada.formato, juntada.tipo);
  const nuevoCarton = generarCarton(
    juntada.id,
    jugadorId,
    jugadorNombre,
    list.length + 1,
    pool,
    juntada.formato,
    list
  );

  // Guardar en localDB y Firestore
  if (!local.cartones[juntada.id]) local.cartones[juntada.id] = [];
  local.cartones[juntada.id].push(nuevoCarton);
  saveLocalDB(local);
  broadcastLocalEvent('CARTONES_UPDATED', { juntadaId: juntada.id, cartones: local.cartones[juntada.id] });

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'juntadas', juntada.id, 'cartones', nuevoCarton.id), nuevoCarton);
      if (juntada.estado !== 'jugando') {
        await updateDoc(doc(db, 'juntadas', juntada.id), { estado: 'jugando' });
      }
    } catch (err) {
      console.warn('Error al guardar nuevo cartón en Firestore:', err);
    }
  }

  return nuevoCarton;
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
  let unsubFirestore: (() => void) | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntadaId, 'cartones', cartonId);
      unsubFirestore = onSnapshot(
        docRef,
        snapshot => {
          if (snapshot.exists()) {
            callback(snapshot.data() as Carton);
          } else {
            const local = getLocalDB();
            const list = local.cartones[juntadaId] || [];
            callback(list.find(c => c.jugadorId === jugadorId) || null);
          }
        },
        error => {
          console.warn('Firestore onSnapshot carton error, fallback local:', error);
          const local = getLocalDB();
          const list = local.cartones[juntadaId] || [];
          callback(list.find(c => c.jugadorId === jugadorId) || null);
        }
      );
    } catch (err) {
      console.warn('Error al suscribir carton:', err);
    }
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
    if (unsubFirestore) unsubFirestore();
    if (localChannel) localChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export function subscribeToAllCartones(
  juntadaId: string,
  callback: (cartones: Carton[]) => void
): () => void {
  let unsubFirestore: (() => void) | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'juntadas', juntadaId, 'cartones');
      unsubFirestore = onSnapshot(
        colRef,
        snapshot => {
          const list: Carton[] = [];
          snapshot.forEach(d => list.push(d.data() as Carton));
          callback(list);
        },
        error => {
          console.warn('Firestore onSnapshot allCartones error, fallback local:', error);
          const local = getLocalDB();
          callback(local.cartones[juntadaId] || []);
        }
      );
    } catch (err) {
      console.warn('Error al suscribir allCartones:', err);
    }
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
): Promise<GanadorInfo | null> {
  const horaNow = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'juntadas', juntadaId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const juntadaData = snap.data() as Juntada;

      if (tipo === 'linea') {
        const ganadoresLineaActuales: GanadorInfo[] = juntadaData.ganadoresLinea || (juntadaData.ganadorLinea ? [juntadaData.ganadorLinea] : []);
        if (ganadoresLineaActuales.length >= 3) {
          return null;
        }
        const numeroLinea = ganadoresLineaActuales.length + 1;
        const ganadorInfo: GanadorInfo = {
          jugadorId,
          nombre: jugadorNombre,
          hora: horaNow,
          tipo: 'linea',
          numeroLinea,
        };
        const updatedGanadores = [...ganadoresLineaActuales, ganadorInfo];
        await updateDoc(docRef, {
          ganadoresLinea: updatedGanadores,
          ganadorLinea: ganadorInfo,
        });
        await updateDoc(doc(db, 'juntadas', juntadaId, 'cartones', cartonId), {
          ganoLineaAt: horaNow,
        });
        return ganadorInfo;
      } else {
        const ganadorInfo: GanadorInfo = {
          jugadorId,
          nombre: jugadorNombre,
          hora: horaNow,
          tipo: 'lleno',
        };
        await updateDoc(docRef, {
          ganadorLleno: ganadorInfo,
          estado: 'terminada',
        });
        await updateDoc(doc(db, 'juntadas', juntadaId, 'cartones', cartonId), {
          ganoLlenoAt: horaNow,
        });
        return ganadorInfo;
      }
    } catch (err) {
      console.warn('Error en cantarVictoria Firestore:', err);
    }
  }

  // Local fallback
  const local = getLocalDB();
  const juntada = local.juntadas[juntadaId];
  if (!juntada) return null;

  if (tipo === 'linea') {
    const ganadoresLineaActuales: GanadorInfo[] = juntada.ganadoresLinea || (juntada.ganadorLinea ? [juntada.ganadorLinea] : []);
    if (ganadoresLineaActuales.length >= 3) {
      return null;
    }
    const numeroLinea = ganadoresLineaActuales.length + 1;
    const ganadorInfo: GanadorInfo = {
      jugadorId,
      nombre: jugadorNombre,
      hora: horaNow,
      tipo: 'linea',
      numeroLinea,
    };
    juntada.ganadoresLinea = [...ganadoresLineaActuales, ganadorInfo];
    juntada.ganadorLinea = ganadorInfo;

    const cList = local.cartones[juntadaId] || [];
    const c = cList.find(x => x.id === cartonId);
    if (c) c.ganoLineaAt = horaNow;

    saveLocalDB(local);
    broadcastLocalEvent('JUNTADA_UPDATED', juntada);
    broadcastLocalEvent('CARTONES_UPDATED', { juntadaId, cartones: local.cartones[juntadaId] });
    return ganadorInfo;
  } else {
    const ganadorInfo: GanadorInfo = {
      jugadorId,
      nombre: jugadorNombre,
      hora: horaNow,
      tipo: 'lleno',
    };
    juntada.ganadorLleno = ganadorInfo;
    juntada.estado = 'terminada';

    const cList = local.cartones[juntadaId] || [];
    const c = cList.find(x => x.id === cartonId);
    if (c) c.ganoLlenoAt = horaNow;

    saveLocalDB(local);
    broadcastLocalEvent('JUNTADA_UPDATED', juntada);
    broadcastLocalEvent('CARTONES_UPDATED', { juntadaId, cartones: local.cartones[juntadaId] });
    return ganadorInfo;
  }
}
