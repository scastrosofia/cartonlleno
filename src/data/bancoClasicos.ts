import { TipoJuntada } from '@/types';

export interface ClasicoPreset {
  id: string;
  texto: string;
  categoria: TipoJuntada;
}

export const BANCO_CLASICOS: ClasicoPreset[] = [
  // --- FAMILIA ---
  { id: 'fam-1', texto: 'La abuela se duerme antes de las 12', categoria: 'familia' },
  { id: 'fam-2', texto: 'Alguien pregunta "¿y el novio / la novia?"', categoria: 'familia' },
  { id: 'fam-3', texto: 'Se corta la luz', categoria: 'familia' },
  { id: 'fam-4', texto: 'Llegan tarde con el hielo', categoria: 'familia' },
  { id: 'fam-5', texto: 'Discusión de política antes del brindis', categoria: 'familia' },
  { id: 'fam-6', texto: 'El perro se esconde por los cohetes', categoria: 'familia' },
  { id: 'fam-7', texto: 'Sobra vitel toné para tres semanas', categoria: 'familia' },
  { id: 'fam-8', texto: 'Alguien llora en el brindis', categoria: 'familia' },
  { id: 'fam-9', texto: 'Se quema algo en la parrilla', categoria: 'familia' },
  { id: 'fam-10', texto: 'El tío cuenta el mismo chiste de siempre', categoria: 'familia' },
  { id: 'fam-11', texto: 'Pan dulce sin abrir porque nadie lo quiere', categoria: 'familia' },
  { id: 'fam-12', texto: 'Videollamada trabada con un primo lejano', categoria: 'familia' },
  { id: 'fam-13', texto: 'Foto grupal fallida porque alguien cerró los ojos', categoria: 'familia' },
  { id: 'fam-14', texto: 'Regalo repetido o par de medias', categoria: 'familia' },
  { id: 'fam-15', texto: 'Brindis antes de hora porque el reloj estaba mal', categoria: 'familia' },
  { id: 'fam-16', texto: 'Alguien se va temprano "porque mañana madruga"', categoria: 'familia' },
  { id: 'fam-17', texto: 'La sidra está caliente', categoria: 'familia' },
  { id: 'fam-18', texto: 'Los nenes corriendo descalzos con chispitas', categoria: 'familia' },
  { id: 'fam-19', texto: 'Alguien critica la ensalada rusa ("le falta mayonesa")', categoria: 'familia' },
  { id: 'fam-20', texto: 'La tía pide bajar la música para charlar', categoria: 'familia' },
  { id: 'fam-21', texto: 'Disputa por llevarse el tupper con ensalada de frutas', categoria: 'familia' },
  { id: 'fam-22', texto: 'Misteriosamente desaparece el abrelatas o destapador', categoria: 'familia' },

  // --- AMIGOS ---
  { id: 'amg-1', texto: 'Alguien derrama fernet en la mesa', categoria: 'amigos' },
  { id: 'amg-2', texto: 'Se debate acaloradamente quién pone la casa en Año Nuevo', categoria: 'amigos' },
  { id: 'amg-3', texto: 'Cae uno que nadie había invitado', categoria: 'amigos' },
  { id: 'amg-4', texto: 'La playlist salta a cumbia santafesina del 2000', categoria: 'amigos' },
  { id: 'amg-5', texto: 'Desaparece el único encendedor que andaba', categoria: 'amigos' },
  { id: 'amg-6', texto: 'Alguien jura: "este año que entra me pongo las pilas"', categoria: 'amigos' },
  { id: 'amg-7', texto: 'Uno desaparece 40 minutos en el baño', categoria: 'amigos' },
  { id: 'amg-8', texto: 'Alguien mezcla bebidas que jamás deberían mezclarse', categoria: 'amigos' },
  { id: 'amg-9', texto: 'Uno ya está durmiendo en un sillón a la 1:30 am', categoria: 'amigos' },
  { id: 'amg-10', texto: 'Discusión seria sobre quién es el mejor 5 de la Selección', categoria: 'amigos' },
  { id: 'amg-11', texto: 'Se rompe un vaso o una copa', categoria: 'amigos' },
  { id: 'amg-12', texto: 'Alguien manda un mensaje de año nuevo al ex', categoria: 'amigos' },
  { id: 'amg-13', texto: 'Pedir delivery a las 3 am que nunca llega', categoria: 'amigos' },
  { id: 'amg-14', texto: 'El DJ improvisado cambia el tema por la mitad', categoria: 'amigos' },
  { id: 'amg-15', texto: 'Alguien se tira a la pileta con ropa puesta', categoria: 'amigos' },
  { id: 'amg-16', texto: 'Se terminan los vasos de plástico y toman de botellas cortadas', categoria: 'amigos' },
  { id: 'amg-17', texto: 'Uno se pone nostálgico recordando la secundaria', categoria: 'amigos' },
  { id: 'amg-18', texto: 'Alguien le saca el celular a otro para que no mande audios', categoria: 'amigos' },
  { id: 'amg-19', texto: 'Se arma pogo con el tema de cierre', categoria: 'amigos' },
  { id: 'amg-20', texto: 'Promesa grupal de irse todos juntos de vacaciones en febrero', categoria: 'amigos' },

  // --- OFICINA ---
  { id: 'ofi-1', texto: 'Alguien toma de más en la barra libre', categoria: 'oficina' },
  { id: 'ofi-2', texto: 'El jefe o directivo intenta bailar reggaetón', categoria: 'oficina' },
  { id: 'ofi-3', texto: 'Alguien pregunta indiscretamente cuándo acreditan el aguinaldo', categoria: 'oficina' },
  { id: 'ofi-4', texto: 'En el amigo invisible a alguien le regalan una taza genérica', categoria: 'oficina' },
  { id: 'ofi-5', texto: 'Alguien se escapa a la francesa antes de las 23 hs', categoria: 'oficina' },
  { id: 'ofi-6', texto: 'Chisme de pasillo destapado entre dos compañeros', categoria: 'oficina' },
  { id: 'ofi-7', texto: 'Discurso motivacional del líder que dura el triple de lo esperado', categoria: 'oficina' },
  { id: 'ofi-8', texto: 'Alguien vino vestido de traje mientras todos fueron de remera', categoria: 'oficina' },
  { id: 'ofi-9', texto: 'Se quejan en voz baja del catering o los sandwichitos', categoria: 'oficina' },
  { id: 'ofi-10', texto: 'El de finanzas o sistemas se suelta y es el alma de la fiesta', categoria: 'oficina' },
  { id: 'ofi-11', texto: 'Alguien habla de trabajo cuando explícitamente dijeron "prohibido"', categoria: 'oficina' },
  { id: 'ofi-12', texto: 'Sorteo de premios donde siempre gana el que menos viene', categoria: 'oficina' },
  { id: 'ofi-13', texto: 'Selfie grupal forzada para el LinkedIn de la empresa', categoria: 'oficina' },
  { id: 'ofi-14', texto: 'Alguien se lleva media bandeja de canapés "para el camino"', categoria: 'oficina' },
  { id: 'ofi-15', texto: 'La anécdota vergonzosa del after office del año pasado', categoria: 'oficina' },
  { id: 'ofi-16', texto: 'Uno dice: "yo el lunes no respondo un solo mail"', categoria: 'oficina' },

  // --- OTRA / GENERAL ---
  { id: 'otr-1', texto: 'Llaman por WhatsApp y no se escucha nada por el eco', categoria: 'otra' },
  { id: 'otr-2', texto: 'Uno se queja del calor insoportable', categoria: 'otra' },
  { id: 'otr-3', texto: 'Mosquitos atacando sin piedad las piernas de todos', categoria: 'otra' },
  { id: 'otr-4', texto: 'El ventilador gira pero solo tira aire caliente', categoria: 'otra' },
  { id: 'otr-5', texto: 'Alguien come turrón blando como si fuera alfajor', categoria: 'otra' },
  { id: 'otr-6', texto: 'Caen visitas sorpresa a saludar "dos minutos"', categoria: 'otra' },
  { id: 'otr-7', texto: 'Alguien derrama el hielo al querer meterlo en la conservadora', categoria: 'otra' },
  { id: 'otr-8', texto: 'El brindis con copas que no hacen juego (vaso de mostaza incluido)', categoria: 'otra' },
];

export function getClasicosPorTipo(tipo: TipoJuntada, limite = 15): ClasicoPreset[] {
  const especificos = BANCO_CLASICOS.filter(c => c.categoria === tipo);
  const generales = BANCO_CLASICOS.filter(c => c.categoria !== tipo);
  return [...especificos, ...generales].slice(0, limite);
}

export function getBancoCompletoParaTipo(tipo: TipoJuntada): ClasicoPreset[] {
  const especificos = BANCO_CLASICOS.filter(c => c.categoria === tipo);
  const otros = BANCO_CLASICOS.filter(c => c.categoria !== tipo);
  return [...especificos, ...otros];
}
