import { ImageResponse } from 'next/og';
import { getJuntadaBySlug } from '@/lib/firebase/service';

export const alt = 'Cartón lleno, corazón contento';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const juntada = await getJuntadaBySlug(slug);

  const nombreJuntada = juntada ? juntada.nombre : 'Tu juntada';
  const fecha = juntada ? juntada.fecha : 'Fin de año';
  const premio = juntada?.premio ? juntada.premio : 'El que gana no lava los platos';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#f8f8f8',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          border: '12px solid #09090b',
        }}
      >
        {/* Top header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#71717a',
            }}
          >
            Human Friendly presenta
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#09090b',
              backgroundColor: '#e4e4e7',
              padding: '8px 18px',
              borderRadius: 24,
            }}
          >
            {fecha}
          </span>
        </div>

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#52525b',
            }}
          >
            Te invitaron al bingo de
          </span>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#09090b',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {nombreJuntada}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 700,
                color: '#09090b',
                backgroundColor: '#ffffff',
                border: '2px solid #09090b',
                padding: '8px 20px',
                borderRadius: 16,
              }}
            >
              🏆 Premio: {premio}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '2px dashed #d4d4d8',
            paddingTop: 24,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#71717a',
            }}
          >
            Entrá para sumar tus clásicos anónimos y jugar en la mesa
          </span>
          <span
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#09090b',
            }}
          >
            cartonlleno.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
