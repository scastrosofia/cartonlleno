'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getJuntadaBySlug,
  subscribeToJuntada,
  subscribeToJugadores,
  addJugador,
  addClasico,
} from '@/lib/firebase/service';
import { getDeviceId, getLocalPlayerSession, saveLocalPlayerSession } from '@/lib/firebase/auth';
import { desduplicarApodo } from '@/lib/bingo/nicknames';
import { Juntada, Jugador } from '@/types';
import { Sparkles, Hourglass, Check } from 'lucide-react';

import { Suspense } from 'react';

function InvitadoSeUneContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [juntada, setJuntada] = useState<Juntada | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [enEspera, setEnEspera] = useState(false);
  const [nombre, setNombre] = useState('');
  const [clasico1, setClasico1] = useState('');
  const [clasico2, setClasico2] = useState('');
  const [clasico3, setClasico3] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cargar juntada por slug
  useEffect(() => {
    async function init() {
      if (!slug) return;
      const found = await getJuntadaBySlug(slug);
      if (!found) {
        setLoading(false);
        return;
      }
      setJuntada(found);

      // Comprobar si este dispositivo ya tiene sesión en esta juntada
      const session = getLocalPlayerSession(found.id);
      if (session) {
        setNombre(session.nombre);
        if (found.estado === 'jugando') {
          router.replace(`/j/${found.slug}/carton`);
          return;
        } else {
          setEnEspera(true);
        }
      }

      setLoading(false);
    }

    init();
  }, [slug, router]);

  // Suscribirse a cambios en la juntada (por si el host reparte mientras estamos en espera)
  useEffect(() => {
    if (!juntada?.id) return;

    const unsubJ = subscribeToJuntada(juntada.id, (updated) => {
      if (updated) {
        setJuntada(updated);
        if (updated.estado === 'jugando' && enEspera) {
          router.push(`/j/${updated.slug}/carton`);
        }
      }
    });

    const unsubJug = subscribeToJugadores(juntada.id, (list) => {
      setJugadores(list);
    });

    return () => {
      unsubJ();
      unsubJug();
    };
  }, [juntada?.id, enEspera, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorNombre('Por favor escribí tu nombre o apodo');
      return;
    }

    if (!juntada) return;

    // Verificar si el apodo ya existe
    const nombresExistentes = jugadores.map((j) => j.nombre);
    const check = desduplicarApodo(nombre, nombresExistentes);

    let nombreFinal = nombre.trim();
    if (!check.disponible) {
      const confirmacion = window.confirm(
        `Ya hay alguien llamado "${nombre.trim()}". ¿Querés usar "${check.sugerencia}"?`
      );
      if (confirmacion) {
        nombreFinal = check.sugerencia;
        setNombre(nombreFinal);
      } else {
        setErrorNombre(`El nombre "${nombre.trim()}" ya está en uso. Probá con otro apodo.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const deviceUid = await getDeviceId();
      const nuevoJugador = await addJugador(juntada.id, nombreFinal, deviceUid, 'celu');
      saveLocalPlayerSession(juntada.id, nuevoJugador.id, nuevoJugador.nombre);

      // Guardar clásicos anónimos
      const clasicosNuevos = [clasico1, clasico2, clasico3].map((c) => c.trim()).filter(Boolean);
      for (const texto of clasicosNuevos) {
        await addClasico(juntada.id, texto);
      }

      if (juntada.estado === 'jugando') {
        router.push(`/j/${juntada.slug}/carton`);
      } else {
        setEnEspera(true);
      }
    } catch (err) {
      console.error('Error al unirse:', err);
      setErrorNombre('Hubo un error al unirte. Volvé a intentar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-neutral-700">Cargando juntada...</p>
        </div>
      </MobileContainer>
    );
  }

  if (!juntada) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 text-center py-12 px-4">
          <h2 className="text-xl font-extrabold text-neutral-900 mb-2">Juntada no encontrada</h2>
          <p className="text-xs text-neutral-600 mb-6">
            Revisá que el link o código sea el correcto.
          </p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </MobileContainer>
    );
  }

  // Pantalla de Sala de Espera si ya se unió pero aún no se repartieron los cartones
  if (enEspera) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 border-[1.5px] border-neutral-300 flex items-center justify-center mb-5 animate-pulse">
            <Hourglass className="w-8 h-8 text-neutral-900" />
          </div>

          <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase mb-1">
            {juntada.nombre}
          </span>
          <h2 className="text-2xl font-extrabold text-neutral-950 mb-2">
            ¡Ya estás adentro, {nombre}!
          </h2>
          <p className="text-xs text-neutral-600 max-w-[280px] mb-8 leading-relaxed">
            Esperando a que quien organiza toque <strong>&quot;Repartir cartones&quot;</strong>. Esta pantalla se actualizará sola apenas empiece el juego.
          </p>

          <div className="w-full p-4 rounded-xl border-[1.5px] border-neutral-200 bg-neutral-50 flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-neutral-900">Jugadores en la mesa:</span>
            <span className="text-xs font-black bg-white px-2.5 py-1 rounded-full border border-neutral-300">
              {jugadores.length}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
            <Sparkles className="w-4 h-4 text-neutral-400" />
            No cierres esta pestaña
          </div>
        </div>
      </MobileContainer>
    );
  }

  // Pantalla 5 según wireframe
  return (
    <MobileContainer>
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 pb-4">
        {/* Banner cartón ilustrado */}
        <div className="w-full p-5 rounded-2xl border-[1.5px] border-dashed border-neutral-300 bg-neutral-50 flex flex-col items-center justify-center min-h-[140px] text-center mb-5">
          <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-1">
            Human Friendly presenta
          </span>
          <span className="text-xs font-extrabold text-neutral-900">
            Cartón lleno, corazón contento
          </span>
          <span className="text-[10px] text-neutral-500 mt-1">
            El bingo de las fiestas
          </span>
        </div>

        {/* Título de invitación */}
        <div className="mb-5">
          <span className="text-xs font-semibold text-neutral-500 block mb-0.5">
            Te invitaron a
          </span>
          <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight leading-tight">
            {juntada.nombre}
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            {juntada.fecha} · Premio: {juntada.premio}
          </p>
        </div>

        {/* Campo Nombre */}
        <div className="mb-5">
          <label className="text-sm font-bold text-neutral-900 block mb-1.5">
            Tu nombre o apodo
          </label>
          <Input
            placeholder="Ej: Tío Rubén"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errorNombre) setErrorNombre('');
            }}
            error={errorNombre}
            autoFocus
          />
        </div>

        {/* Campos de clásicos anónimos */}
        <div className="flex flex-col gap-2.5 mb-6">
          <div>
            <label className="text-sm font-bold text-neutral-900 block">
              Sumá tus clásicos (opcional)
            </label>
            <span className="text-xs text-neutral-500 block">
              Nadie va a saber quién escribió qué.
            </span>
          </div>

          <Input
            placeholder="a. Ej: Alguien dice que el asado está crudo"
            value={clasico1}
            onChange={(e) => setClasico1(e.target.value)}
          />
          <Input
            placeholder="b. Ej: Brindan con la copa equivocada"
            value={clasico2}
            onChange={(e) => setClasico2(e.target.value)}
          />
          <Input
            placeholder="c. Ej: Se pierde el destapador"
            value={clasico3}
            onChange={(e) => setClasico3(e.target.value)}
          />
        </div>

        {/* Botón Entrar */}
        <div className="mt-auto pt-2">
          <Button size="lg" fullWidth type="submit" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar al bingo'}
          </Button>
        </div>
      </form>
    </MobileContainer>
  );
}

export default function InvitadoSeUnePage() {
  return (
    <Suspense
      fallback={
        <MobileContainer>
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-neutral-700">Cargando...</p>
          </div>
        </MobileContainer>
      }
    >
      <InvitadoSeUneContent />
    </Suspense>
  );
}

