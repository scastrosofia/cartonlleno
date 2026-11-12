import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

const LOCAL_DEVICE_KEY = 'carton_lleno_device_uid';

function getOrGenerateLocalUid(): string {
  if (typeof window === 'undefined') return 'server_uid';
  let uid = localStorage.getItem(LOCAL_DEVICE_KEY);
  if (!uid) {
    uid = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(LOCAL_DEVICE_KEY, uid);
  }
  return uid;
}

/**
 * Obtiene el UID anónimo del dispositivo actual, autenticando con Firebase si está disponible,
 * o usando un ID único persistido en localStorage.
 */
export async function getDeviceId(): Promise<string> {
  if (typeof window === 'undefined') return 'server_uid';

  if (isFirebaseConfigured && auth) {
    if (auth.currentUser) {
      return auth.currentUser.uid;
    }
    try {
      const cred = await signInAnonymously(auth);
      return cred.user.uid;
    } catch (err) {
      console.warn('Error en Firebase signInAnonymously, usando ID local:', err);
      return getOrGenerateLocalUid();
    }
  }

  return getOrGenerateLocalUid();
}

/**
 * Guarda el mapeo del jugador para una juntada en este dispositivo
 */
export function saveLocalPlayerSession(juntadaId: string, jugadorId: string, nombre: string) {
  if (typeof window === 'undefined') return;
  const key = `carton_session_${juntadaId}`;
  localStorage.setItem(key, JSON.stringify({ jugadorId, nombre, updatedAt: Date.now() }));
}

/**
 * Recupera el jugador previo asignado a este dispositivo en esta juntada
 */
export function getLocalPlayerSession(juntadaId: string): { jugadorId: string; nombre: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`carton_session_${juntadaId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
