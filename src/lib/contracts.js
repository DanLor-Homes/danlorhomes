const BLANK = '____________________';

const money = (value) =>
  Number(value) > 0
    ? `${Number(value).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`
    : `${BLANK} €`;

const text = (value, fallback = BLANK) => {
  const clean = typeof value === 'string' ? value.trim() : '';
  return clean || fallback;
};

export const CONTRACT_TYPES = [
  { id: 'arras', label: 'Arras penitenciales', hint: 'Reserva el inmueble y fija precio y fecha de escritura.' },
  { id: 'alquiler', label: 'Arrendamiento de vivienda', hint: 'Renta mensual, fianza y duración del contrato.' },
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

export function buildContract({ type, property, client, date, signal, months, monthlyRent }) {
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