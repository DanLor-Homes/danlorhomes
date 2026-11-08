const BLANK = '____________________';

const money = (value) =>
  Number(value) > 0
    ? `${Number(value).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`
    : `${BLANK} €`;

const text = (value, fallback = BLANK) => {
  const clean = typeof value === 'string' ? value.trim() : '';
  return clean || fallback;
};

export const DEFAULT_INVENTORY = [
  'Cocina: nevera combi, horno, microondas y vitrocerámica',
  'Cocina: menaje completo, vajilla y cubertería para 6 personas',
  'Cocina: cafetera, tostadora y lavavajillas',
  'Lavadora, secadora, plancha y tabla de planchar',
  'Salón: sofá, mesa de comedor con sillas, televisión y aire acondicionado',
  'Dormitorio principal: cama de matrimonio, armario, mesillas y lámparas',
  'Dormitorio 2: dos camas individuales y armario',
  'Baños: toallas por ocupante, secador y mampara',
  'Textil: juego de sábanas de repuesto por cama, mantas y edredones',
  'Exterior: mesa y sillas de terraza, toldo y tendedero',
  'Otros: router wifi, dos juegos de llaves, mando de garaje y extintor',
].join('\n');

export const CONTRACT_TYPES = [
  { id: 'arras', label: 'Arras penitenciales', hint: 'Reserva el inmueble y fija precio y fecha de escritura.' },
  { id: 'alquiler', label: 'Arrendamiento de vivienda', hint: 'Renta mensual, fianza y duración del contrato.' },
  {
    id: 'vacacional',
    label: 'Arrendamiento vacacional',
    hint: 'Estancia temporal por noches: fechas, ocupantes, fianza e inventario.',
  },
  {
    id: 'colaboracion',
    label: 'Colaboración entre inmobiliarias',
    hint: 'Acuerdo con otra agencia: reparto de honorarios y protección de clientes.',
  },
  { id: 'encargo', label: 'Hoja de encargo de venta', hint: 'Mandato de comercialización y honorarios.' },
];

const today = () => new Date().toISOString().slice(0, 10);

const longDate = (value) => {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

const addDays = (value, days) => {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return longDate(date.toISOString().slice(0, 10));
};

function propertyLines(property) {
  const parts = [];
  const address = text(property.address, '');
  if (address) parts.push(address);
  if (property.zone) parts.push(property.zone);
  const where = parts.length ? parts.join(', ') : text(property.zone, BLANK);
  const details = [];
  if (property.surface) details.push(`${property.surface} m² construidos`);
  if (property.rooms) details.push(`${property.rooms} habitaciones`);
  if (property.bathrooms) details.push(`${property.bathrooms} baños`);
  return `Inmueble denominado «${text(property.title, 'inmueble')}», situado en ${where}${
    details.length ? `, con ${details.join(', ')}` : ''
  }. Referencia catastral: ${text(property.cadastral_reference)}. Referencia interna: ${text(property.reference)}.`;
}

function nightsBetween(from, to) {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const nights = Math.round((end - start) / 86400000);
  return nights > 0 ? nights : 0;
}

export function buildContract({
  type,
  property,
  client,
  date,
  signal,
  months,
  monthlyRent,
  checkIn,
  checkOut,
  guests,
  nightlyRate,
  deposit,
  inventory,
  splitPercent,
}) {
  const propertyData = property || {};
  const clientData = client || {};
  const signedOn = longDate(date || today());

  const seller = `D./Dña. ${text(propertyData.owner_name, 'propietario/a')}, con NIF ${BLANK} y teléfono ${text(
    propertyData.owner_phone
  )}`;
  const buyer = `D./Dña. ${text(clientData.name, 'cliente')}, con NIF ${BLANK}, teléfono ${text(
    clientData.phone
  )} y correo electrónico ${text(clientData.email)}`;

  const parties = {
    title: 'Partes intervinientes',
    paragraphs: [seller, buyer],
  };

  if (type === 'arras') {
    const amount = Number(propertyData.price) || 0;
    const deposit = signal ? Number(signal) : amount * 0.1;
    return {
      title: 'Contrato de arras penitenciales',
      place: `En ${text(propertyData.zone, BLANK)}, a ${signedOn}.`,
      sections: [
        parties,
        { title: 'Inmueble objeto del contrato', paragraphs: [propertyLines(propertyData)] },
        {
          title: 'Precio y cantidad entregada',
          paragraphs: [
            `El precio total de la compraventa se fija en ${money(amount)}, libre de cargas y al corriente de los gastos de comunidad e IBI.`,
            `En este acto la parte compradora entrega a la parte vendedora la cantidad de ${money(deposit)} en concepto de arras penitenciales, que se imputarán al precio final.`,
          ],
        },
        {
          title: 'Plazo para el otorgamiento de escritura',
          paragraphs: [
            `Las partes se comprometen a otorgar escritura pública de compraventa ante notario antes del ${addDays(
              date,
              30
            )}, en la notaría que designe la parte compradora.`,
          ],
        },
        {
          title: 'Gastos e impuestos',
          paragraphs: [
            'Los gastos e impuestos derivados de la compraventa (notaría, registro, gestoría e impuesto de transmisiones) serán por cuenta de la parte compradora, salvo la plusvalía municipal, que corresponde a la parte vendedora.',
          ],
        },
        {
          title: 'Carácter penitencial',
          paragraphs: [
            'Si la parte compradora desistiera del contrato, perderá la cantidad entregada en concepto de arras. Si fuera la parte vendedora quien desistiera, deberá devolver dicha cantidad duplicada.',
            'El incumplimiento del plazo de escrituración por causas imputables a una de las partes se regirá por lo previsto en este mismo pacto.',
          ],
        },
        {
          title: 'Protección de datos',
          paragraphs: [
            'Los datos personales facilitados se tratarán con la finalidad de formalizar esta relación contractual y se conservarán durante los plazos legalmente exigibles, conforme al Reglamento (UE) 2016/679.',
          ],
        },
      ],
      signatures: ['La parte compradora', 'La parte vendedora'],
    };
  }

  if (type === 'alquiler') {
    const rent = monthlyRent ? Number(monthlyRent) : Number(propertyData.price) || 0;
    const term = Number(months) || 12;
    return {
      title: 'Contrato de arrendamiento de vivienda',
      place: `En ${text(propertyData.zone, BLANK)}, a ${signedOn}.`,
      sections: [
        {
          title: 'Partes intervinientes',
          paragraphs: [
            `${seller}, en calidad de arrendador.`,
            `${buyer}, en calidad de arrendatario.`,
          ],
        },
        { title: 'Vivienda arrendada', paragraphs: [propertyLines(propertyData)] },
        {
          title: 'Duración',
          paragraphs: [
            `El contrato se formaliza por un plazo de ${term} meses, prorrogable conforme al artículo 9 de la Ley 29/1994 de Arrendamientos Urbanos.`,
          ],
        },
        {
          title: 'Renta y fianza',
          paragraphs: [
            `La renta mensual se fija en ${money(rent)}, pagadera dentro de los cinco primeros días de cada mes mediante transferencia a la cuenta que designe el arrendador.`,
            `Se entrega en este acto una fianza equivalente a una mensualidad (${money(rent)}), que será devuelta al finalizar el contrato previa comprobación del estado de la vivienda.`,
          ],
        },
        {
          title: 'Suministros y gastos',
          paragraphs: [
            `Los suministros individuales (agua, luz y gas) corren por cuenta del arrendatario. Los gastos de comunidad ${
              propertyData.community_fees ? `(${money(propertyData.community_fees)}/mes)` : ''
            } corresponde abonarlos al arrendador, salvo pacto expreso en contrario. El IBI es a cargo de la propiedad.`,
          ],
        },
        {
          title: 'Uso y conservación',
          paragraphs: [
            'El arrendatario destinará la vivienda a uso de vivienda permanente, sin subarrendar ni ceder el contrato sin autorización escrita del arrendador, y se compromete a mantenerla en buen estado.',
            'El arrendador responde de las reparaciones necesarias para conservar la vivienda en condiciones de habitabilidad.',
          ],
        },
        {
          title: 'Legislación aplicable',
          paragraphs: [
            'En lo no previsto en este contrato se aplicará la Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos, y el Código Civil.',
          ],
        },
      ],
      signatures: ['El arrendador', 'El arrendatario'],
    };
  }

  if (type === 'vacacional') {
    const nights = nightsBetween(checkIn, checkOut);
    const rate = Number(nightlyRate) || 0;
    const total = rate && nights ? rate * nights : 0;
    const security = Number(deposit) || 0;
    const occupancy = Number(guests) || 0;
    const annexItems = String(inventory || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      title: 'Contrato de arrendamiento de vivienda con fines turísticos',
      place: `En ${text(propertyData.zone, BLANK)}, a ${signedOn}.`,
      sections: [
        {
          title: 'Partes intervinientes',
          paragraphs: [
            `${seller}, en calidad de arrendador.`,
            `${buyer}, en calidad de arrendatario y responsable de la reserva.`,
          ],
        },
        {
          title: 'Vivienda objeto del contrato',
          paragraphs: [
            propertyLines(propertyData),
            'La vivienda se entrega completamente amueblada y equipada para su uso inmediato, con el ajuar, menaje y lencería que se detallan en el inventario anexo, que las partes firman junto con este contrato.',
          ],
        },
        {
          title: 'Destino y naturaleza temporal',
          paragraphs: [
            'El presente contrato se otorga para el uso temporal de la vivienda por el arrendatario y los ocupantes autorizados, con exclusión de cualquier otro destino.',
            'Esta relación queda excluida del ámbito de la Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos, conforme a su artículo 3.2, al tratarse de un arrendamiento de temporada por motivos turísticos o vacacionales. El arrendatario declara expresamente que la vivienda no constituirá su residencia habitual ni permanente y que no empadronará en ella a persona alguna.',
          ],
        },
        {
          title: 'Duración, entrada y salida',
          paragraphs: [
            nights
              ? `La estancia comprende ${nights} ${nights === 1 ? 'noche' : 'noches'}, con entrada el ${longDate(
                  checkIn
                )} a partir de las 16:00 horas y salida el ${longDate(
                  checkOut
                )} antes de las 12:00 horas.`
              : `La estancia se extiende desde el ${text(
                  checkIn,
                  BLANK
                )} hasta el ${text(checkOut, BLANK)}, con entrada a partir de las 16:00 horas y salida antes de las 12:00 horas.`,
            'Cualquier prolongación de la estancia requerirá acuerdo escrito entre las partes y disponibilidad de la vivienda. La permanencia en la vivienda fuera del horario de salida podrá generar el correspondiente suplemento.',
          ],
        },
        {
          title: 'Precio y forma de pago',
          paragraphs: [
            rate
              ? `El precio de la estancia se fija en ${money(rate)} por noche, resultando un importe total de ${money(
                  total
                )} por las noches contratadas.`
              : `El precio de la estancia se fija en ${BLANK} € por noche, resultando un importe total de ${money(total)}.`,
            'El precio incluye el uso de la vivienda con su mobiliario y equipamiento, así como los suministros ordinarios de agua, luz, gas y conexión a internet, y la limpieza final. No incluye los consumos extraordinarios, los servicios adicionales solicitados por el arrendatario ni los gastos derivados de un uso indebido.',
            'El importe total se abonará mediante transferencia bancaria a la cuenta designada por el arrendador antes de la entrada en la vivienda. El impago en el plazo acordado faculta al arrendador para resolver el contrato y dejar sin efecto la reserva.',
          ],
        },
        {
          title: 'Fianza y garantía',
          paragraphs: [
            security
              ? `El arrendatario entrega en este acto la cantidad de ${money(
                  security
                )} en concepto de fianza, que no se imputa al precio de la estancia.`
              : `El arrendatario entrega en este acto la cantidad de ${BLANK} € en concepto de fianza, que no se imputa al precio de la estancia.`,
            'La fianza será devuelta en el plazo máximo de siete días naturales desde la salida, previa comprobación del estado de la vivienda y del inventario, con deducción de los desperfectos, faltas, pérdida de llaves o consumos extraordinarios que se acrediten.',
          ],
        },
        {
          title: 'Ocupantes y cesión',
          paragraphs: [
            occupancy
              ? `La vivienda se destina a un máximo de ${occupancy} ${
                  occupancy === 1 ? 'ocupante' : 'ocupantes'
                }, incluidos los menores de edad, sin que pueda alojarse a más personas ni siquiera de forma temporal.`
              : `La vivienda se destina a un máximo de ${BLANK} ocupantes, incluidos los menores de edad, sin que pueda alojarse a más personas ni siquiera de forma temporal.`,
            'Queda prohibido subarrendar la vivienda, ceder el contrato o alojar a terceros no autorizados. El incumplimiento de este pacto faculta al arrendador para resolver el contrato y exigir el desalojo inmediato, sin derecho a devolución del precio.',
          ],
        },
        {
          title: 'Normas de uso y convivencia',
          paragraphs: [
            'El arrendatario se compromete a respetar el descanso de los vecinos, especialmente entre las 22:00 y las 08:00 horas, a no celebrar fiestas ni reuniones que alteren la convivencia, y a cumplir las normas de la comunidad de propietarios y las ordenanzas municipales.',
            'No se permite fumar en el interior de la vivienda ni el alojamiento de mascotas, salvo autorización escrita del arrendador. El arrendatario responderá de las molestias o sanciones que su conducta genere.',
          ],
        },
        {
          title: 'Conservación, inventario y responsabilidad',
          paragraphs: [
            'El arrendatario recibe la vivienda en buen estado de conservación y limpieza, obligándose a mantenerla en las mismas condiciones y a comunicar de inmediato cualquier incidencia.',
            'El arrendatario responderá de los daños causados en la vivienda, su mobiliario o su equipamiento, así como del coste de sustitución de las llaves o del cambio de cerradura en caso de pérdida, y de los daños causados a terceros derivados de un uso inadecuado del inmueble.',
          ],
        },
        {
          title: 'Cancelación y desistimiento',
          paragraphs: [
            'Si el arrendatario cancela con más de 30 días de antelación a la fecha de entrada, se devolverá el importe abonado salvo la fianza en concepto de gastos de gestión. Si la cancelación se produce entre 30 y 7 días antes, se devolverá el 50 % del importe. Con menos de 7 días de antelación no procederá devolución alguna.',
            'Si el arrendador no pudiera entregar la vivienda por causas ajenas a su voluntad, lo comunicará de inmediato y devolverá íntegramente las cantidades percibidas, sin que proceda indemnización adicional.',
          ],
        },
        {
          title: 'Registro de viajeros y protección de datos',
          paragraphs: [
            'El arrendatario y los ocupantes se comprometen a facilitar los datos exigidos por el Real Decreto 933/2021, de 26 de octubre, y a identificarse a su llegada. Dichos datos se comunicarán a las Fuerzas y Cuerpos de Seguridad del Estado conforme a la normativa aplicable.',
            'Los datos personales facilitados se tratarán con la finalidad de formalizar y ejecutar esta relación contractual y se conservarán durante los plazos legalmente exigibles, conforme al Reglamento (UE) 2016/679 y a la Ley Orgánica 3/2018.',
          ],
        },
        {
          title: 'Habilitación turística y legislación aplicable',
          paragraphs: [
            `La vivienda cuenta con el número de registro de vivienda de uso turístico ${BLANK} y con la cédula de habitabilidad u ocupación en vigor.`,
            'En lo no previsto en este contrato se aplicará el Código Civil, la normativa autonómica reguladora de las viviendas de uso turístico y las ordenanzas municipales que resulten de aplicación. Las partes se someten para cualquier controversia a los juzgados y tribunales del lugar del inmueble.',
          ],
        },
      ],
      annex: annexItems.length
        ? {
            title: 'Anexo I. Inventario de mobiliario y equipamiento',
            intro:
              'El arrendatario declara haber recibido los siguientes bienes en buen estado de conservación y funcionamiento, comprometiéndose a devolverlos en las mismas condiciones al finalizar la estancia. Cualquier falta o desperfecto se valorará según su coste de reposición y se deducirá de la fianza.',
            items: annexItems,
          }
        : null,
      signatures: ['El arrendador', 'El arrendatario'],
    };
  }

  if (type === 'colaboracion') {
    const agency = `D./Dña. ${text(clientData.name, 'agencia colaboradora')}${
      clientData.contact_person ? `, representada por ${clientData.contact_person}` : ''
    }, con NIF ${BLANK} y domicilio profesional ${BLANK}, teléfono ${text(
      clientData.phone
    )} y correo electrónico ${text(clientData.email)}`;
    const term = Number(months) || 12;
    const totalCommission = Number(propertyData.commission_percent) || 0;
    const split = Number(splitPercent);
    const ourShare = split > 0 && split < 100 ? split : 50;
    const theirShare = 100 - ourShare;

    return {
      title: 'Contrato de colaboración entre agencias inmobiliarias',
      place: `En ${text(propertyData.zone, BLANK)}, a ${signedOn}.`,
      sections: [
        {
          title: 'Partes intervinientes',
          paragraphs: [
            'DAN&LOR HOMES, con NIF ____________________ y domicilio profesional ____________________, en calidad de agencia inmobiliaria.',
            `${agency}, en calidad de agencia colaboradora.`,
          ],
        },
        {
          title: 'Objeto de la colaboración',
          paragraphs: [
            'Las partes suscriben el presente acuerdo con el fin de colaborar de forma coordinada en la comercialización del siguiente inmueble:',
            propertyLines(propertyData),
            'La colaboración comprende la difusión del inmueble en los canales de cada agencia y la captación y presentación de clientes interesados, con el objetivo de lograr su venta en las mejores condiciones de mercado.',
          ],
        },
        {
          title: 'Régimen de la colaboración',
          paragraphs: [
            'Las partes actuarán con lealtad y transparencia, compartiendo la información necesaria sobre el inmueble y los clientes interesados y coordinando las visitas para evitar duplicidades y molestias a la propiedad.',
            'Ninguna de las partes ostenta representación legal de la otra ni puede comprometer su voluntad frente a propietarios o clientes sin autorización previa y escrita.',
          ],
        },
        {
          title: 'Honorarios y reparto de la comisión',
          paragraphs: [
            totalCommission
              ? `Los honorarios totales de la intermediación se fijan en ${totalCommission} % del precio de venta del inmueble, más el IVA correspondiente.`
              : `Los honorarios totales de la intermediación se fijan en ${BLANK} % del precio de venta del inmueble, más el IVA correspondiente.`,
            `Dichos honorarios se repartirán en un ${ourShare} % a favor de DAN&LOR HOMES y un ${theirShare} % a favor de la agencia colaboradora, devengándose en el momento del otorgamiento de la escritura pública de compraventa y abonándose en el plazo de 30 días desde la emisión de la factura.`,
            'En ningún caso se repercutirán honorarios duplicados a la propiedad: la retribución pactada se satisfará por una sola vez y se distribuirá conforme al reparto anterior.',
          ],
        },
        {
          title: 'Obligaciones de las partes',
          paragraphs: [
            'Cada parte identificará por escrito a los clientes que presente, con su nombre y datos de contacto, a fin de acreditar su intervención en la operación.',
            'Las partes se comprometen a no contactar con los clientes o propietarios presentados por la otra parte para ofrecerles servicios distintos del objeto de este acuerdo, ni a captarlos para su propia cartera, durante la vigencia del contrato y en los seis meses siguientes a su finalización.',
            'Cada parte asume los gastos propios de su actividad, responde de sus propios actos frente a clientes y propietarios y mantiene indemne a la otra parte de cualquier reclamación derivada de su actuación.',
          ],
        },
        {
          title: 'Vigencia y resolución',
          paragraphs: [
            `El presente acuerdo tendrá una vigencia de ${term} meses desde su firma, prorrogable por acuerdo escrito de las partes.`,
            'Cualquiera de las partes podrá resolverlo por incumplimiento de la otra, mediante comunicación escrita con quince días de preaviso. La resolución no afectará a las operaciones ya iniciadas con clientes debidamente acreditados, que se liquidarán conforme a lo pactado.',
          ],
        },
        {
          title: 'Confidencialidad y protección de datos',
          paragraphs: [
            'Las partes mantendrán en confidencialidad la información comercial, la cartera de clientes y la documentación del inmueble a la que accedan con motivo de este acuerdo.',
            'Los datos personales intercambiados se tratarán únicamente para la gestión de la colaboración y no se cederán a terceros, conforme al Reglamento (UE) 2016/679 y a la Ley Orgánica 3/2018.',
          ],
        },
        {
          title: 'Legislación aplicable y jurisdicción',
          paragraphs: [
            'El presente contrato se rige por el Código Civil y el Código de Comercio. Para cualquier controversia derivada del mismo, las partes se someten a los juzgados y tribunales del domicilio de DAN&LOR HOMES.',
          ],
        },
      ],
      signatures: ['DAN&LOR HOMES', 'Agencia colaboradora'],
    };
  }

  const commission = Number(propertyData.commission_percent);
  return {
    title: 'Hoja de encargo de venta',
    place: `En ${text(propertyData.zone, BLANK)}, a ${signedOn}.`,
    sections: [
      {
        title: 'Partes intervinientes',
        paragraphs: [
          `${seller}, en calidad de propietario/a.`,
          'DAN&LOR HOMES, con NIF ____________________ y domicilio profesional ____________________, en calidad de agencia inmobiliaria.',
        ],
      },
      { title: 'Inmueble objeto del encargo', paragraphs: [propertyLines(propertyData)] },
      {
        title: 'Tipo de mandato',
        paragraphs: [
          propertyData.exclusive
            ? 'El encargo se otorga en régimen de exclusiva, comprometiéndose la propiedad a no contratar la comercialización con otras agencias durante la vigencia del mandato.'
            : 'El encargo se otorga en régimen de mandato no exclusivo, pudiendo la propiedad comercializar el inmueble por otros canales.',
          propertyData.mandate_start || propertyData.mandate_end
            ? `Vigencia: desde ${text(propertyData.mandate_start, 'la firma')} hasta ${text(propertyData.mandate_end, '90 días')}.`
            : 'Vigencia inicial de 90 días, prorrogable de forma expresa por acuerdo de las partes.',
        ],
      },
      {
        title: 'Precio de salida y honorarios',
        paragraphs: [
          `El precio de salida recomendado se fija en ${money(propertyData.price)}, revisable de mutuo acuerdo según la evolución del mercado.`,
          `Los honorarios de la agencia se fijan en ${
            commission ? `${commission} % del precio de venta` : `${BLANK} % del precio de venta`
          }, devengándose íntegramente en el momento del otorgamiento de la escritura pública de compraventa.${
            propertyData.commission_notes ? ` ${propertyData.commission_notes}` : ''
          }`,
        ],
      },
      {
        title: 'Obligaciones de la agencia',
        paragraphs: [
          'DAN&LOR HOMES se compromete a difundir el inmueble en los portales y canales acordados, atender las visitas, filtrar demandantes y reportar el resultado de la comercialización de forma periódica.',
        ],
      },
      {
        title: 'Obligaciones de la propiedad',
        paragraphs: [
          'La propiedad declara ser titular del inmueble, hallarse al corriente de los gastos de comunidad e IBI y facilitar la documentación necesaria (nota simple, certificado energético, cédula de habitabilidad) para la comercialización.',
        ],
      },
      {
        title: 'Protección de datos',
        paragraphs: [
          'Los datos personales facilitados se tratarán con la finalidad de gestionar el presente encargo y se conservarán durante los plazos legalmente exigibles, conforme al Reglamento (UE) 2016/679.',
        ],
      },
    ],
    signatures: ['La propiedad', 'DAN&LOR HOMES'],
  };
}