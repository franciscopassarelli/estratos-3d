// Guías y artículos. Para publicar uno nuevo, agregá un objeto a GUIDES:
// aparece solo en /guias, en el sitemap y como página estática en el build.
// `objectId` enlaza la guía con su diseño del catálogo (opcional).

export const GUIDES = [
  {
    slug: 'llavero-con-nombre',
    objectId: 'llavero',
    kind: 'Guía de diseño',
    title: 'Cómo hacer un llavero con nombre para imprimir en 3D',
    description: 'Medidas recomendadas, tipografías, argolla y ajustes de impresión para que un llavero con nombre salga firme y legible.',
    minutes: 5,
    sections: [
      { h: 'Qué estilo elegir', html: `
        <p>El estilo <b>Contorno</b> dibuja la base siguiendo la silueta de las letras, con un margen alrededor. Es el clásico llavero de nombre y usa poco material. Funciona mejor con nombres de 3 a 8 letras y tipografías gruesas, porque las letras tienen que quedar unidas por la base.</p>
        <p><b>Cápsula</b> y <b>Placa</b> ponen el texto sobre una forma regular. Son más resistentes y admiten los acabados grabado e incrustado, que no se pueden hacer en contorno porque no hay una superficie lisa alrededor del texto.</p>` },
      { h: 'Medidas que funcionan', html: `
        <ul>
          <li><b>Altura de las mayúsculas:</b> entre 9 y 14 mm. Por debajo de 8 mm, las curvas finas de algunas letras pierden definición con una boquilla de 0,4 mm.</li>
          <li><b>Grosor de la base:</b> 3 mm alcanza para el uso diario. Con 2 mm se dobla si el nombre es largo.</li>
          <li><b>Relieve del texto:</b> 1 a 1,5 mm. Más alto no se lee mejor y se engancha en el bolsillo.</li>
          <li><b>Argolla:</b> agujero de 4,5 mm para argollas de 25 mm, con al menos 2,5 mm de pared alrededor.</li>
        </ul>
        <p>El editor avisa si un trazo del texto mide menos de 0,8 mm (dos líneas de extrusión), si el agujero toca las letras o si la base quedó partida en piezas sueltas.</p>` },
      { h: 'Tipografía', html: `
        <p>Para relieve, las fuentes de trazo grueso como Archivo Black o Titan One dan los mejores resultados. Pacifico es cursiva y sus letras se unen entre sí, lo que la hace ideal para el estilo contorno, pero necesita un tamaño mayor: sus trazos finos se pierden por debajo de 11 mm.</p>` },
      { h: 'Imprimirlo a dos colores', html: `
        <p>Si descargás el 3MF, la base y el texto llegan como piezas separadas y en una impresora multicolor alcanza con asignarle un filamento a cada una. Con una impresora de un solo extrusor, agregá un cambio de filamento en la primera capa del texto: el panel del editor muestra a qué altura empieza. Lo explicamos paso a paso en <a href="/guias/imprimir-dos-colores-sin-multicolor">la guía de dos colores</a>.</p>` },
      { h: 'Ajustes de laminado sugeridos', html: `
        <ul><li>Capa de 0,2 mm (o 0,12 mm si querés letras más nítidas).</li><li>3 perímetros y 20 % de relleno.</li><li>Primera capa lenta y la cama bien limpia: la pieza es chica y tiene poca superficie de apoyo.</li></ul>` },
    ],
  },
  {
    slug: 'placa-decorativa',
    objectId: 'placa',
    kind: 'Guía de diseño',
    title: 'Placas y carteles personalizados: diseño e impresión',
    description: 'Cómo armar una placa para puerta, consultorio o local: tamaños de texto, marcos, agujeros para colgar y materiales para interior o exterior.',
    minutes: 6,
    sections: [
      { h: 'Planificar el texto', html: `
        <p>Una placa se lee de lejos, así que el tamaño de letra importa más que el tamaño de la placa. Como referencia, las mayúsculas de 10 mm se leen bien a un par de metros, y las de 20 mm, desde el otro lado de una sala. La segunda línea se dibuja al 55 % de la principal: sirve para un subtítulo, un horario o un número de oficina.</p>
        <p>Si el texto no entra, el editor lo achica solo y te dice a qué porcentaje quedó. Si queda por debajo de 5 mm de alto, conviene agrandar la placa o acortar el texto.</p>` },
      { h: 'Relieve, grabado o incrustado', html: `
        <ul>
          <li><b>Relieve:</b> el texto sobresale. Es el más fácil de pintar o de imprimir en dos colores con un cambio de filamento.</li>
          <li><b>Grabado:</b> el texto queda hundido en un solo color. Se ve elegante con filamentos de seda o madera.</li>
          <li><b>Incrustado:</b> el texto queda a ras de la superficie, en otro color. Necesita una impresora multicolor o cambios manuales en varias capas, pero el resultado es una superficie lisa y fácil de limpiar.</li>
        </ul>` },
      { h: 'Marco y decoración', html: `
        <p>El marco elevado define el borde y, de paso, hace la placa más rígida. Entre 2 y 4 mm de ancho es lo habitual. Los símbolos laterales (corazones, estrellas, coronas) se dibujan como geometría real, a la misma altura que el texto, para que se impriman sin problemas.</p>` },
      { h: 'Colgar la placa', html: `
        <p>La opción de dos agujeros deja perforaciones de 4,5 mm cerca de las esquinas superiores, pensadas para tornillos de 3,5 o 4 mm. El editor comprueba que no toquen el texto. Para una pared lisa, también podés pegarla con cinta doble faz de espuma.</p>` },
      { h: 'Interior o exterior', html: `
        <p>El PLA se deforma por encima de unos 55-60 °C, algo que un cartel al sol puede alcanzar en verano. Para exterior usá PETG o, mejor, ASA, que resiste la radiación UV. Más detalles en <a href="/guias/pla-petg-asa-que-material-usar">la guía de materiales</a>.</p>` },
    ],
  },
  {
    slug: 'soporte-para-celular',
    objectId: 'soporte-celular',
    kind: 'Guía de diseño',
    title: 'Soporte para celular impreso en 3D: medidas y orientación',
    description: 'Cómo ajustar el ángulo, la ranura y la base de un soporte para celular, y por qué conviene imprimirlo de costado.',
    minutes: 5,
    sections: [
      { h: 'Medí tu celular con la funda puesta', html: `
        <p>El dato clave es el grosor del celular <b>con funda</b>. Sumale 1 o 2 mm de juego y usá ese valor como "espacio para el celular". Si queda justo, el teléfono se traba; si queda muy holgado, se inclina hacia adelante.</p>` },
      { h: 'Ángulo y estabilidad', html: `
        <p>Entre 60° y 70° es cómodo para leer en el escritorio; 75-80° funciona mejor para videollamadas. Cuanto más vertical es el respaldo, más alto queda el centro de gravedad: por eso el editor avisa si la parte de arriba del respaldo sobresale por detrás de la base, porque en ese caso el peso del celular puede volcarlo.</p>` },
      { h: 'Abertura para el cable', html: `
        <p>La abertura en el labio frontal deja pasar el cable de carga. Sus lados están inclinados a unos 51° a propósito: así, cuando el soporte se imprime de costado, no queda ningún techo en el aire y no hacen falta soportes.</p>` },
      { h: 'Por qué imprimirlo de costado', html: `
        <p>Impreso de pie, la parte inferior del respaldo queda en voladizo y necesita soportes. De costado, todo el perfil apoya en la cama y las capas quedan a lo largo de las piezas, que es la dirección más resistente. Por eso es la orientación recomendada. El panel de impresión calcula la superficie con voladizos de más de 45° para cada orientación, así podés compararlas.</p>` },
      { h: 'Ajustes sugeridos', html: `<ul><li>4 perímetros: la unión entre la base y el respaldo es la zona que más trabaja.</li><li>20-25 % de relleno.</li><li>PLA o PETG.</li></ul>` },
    ],
  },
  {
    slug: 'organizador-de-escritorio',
    objectId: 'organizador',
    kind: 'Guía de diseño',
    title: 'Organizador de escritorio a medida: compartimentos y paredes',
    description: 'Cómo calcular compartimentos, elegir el grosor de pared y agregar una etiqueta frontal a un organizador impreso en 3D.',
    minutes: 5,
    sections: [
      { h: 'Empezá por lo que vas a guardar', html: `
        <p>Medí el objeto más grande que va a ir en cada compartimento y sumale 4-5 mm de holgura. Un lápiz necesita un hueco de unos 12 mm; unas tijeras, un compartimento de 25 mm o más. El editor calcula el tamaño de cada hueco a partir del tamaño total, la cantidad de filas y columnas, y el grosor de pared, y avisa si quedan por debajo de 18 mm.</p>` },
      { h: 'Grosor de pared', html: `
        <p>Con una boquilla de 0,4 mm, 1,2 mm equivale a tres líneas de extrusión, y es el mínimo razonable para que la pared sea rígida. Entre 1,6 y 2 mm es un buen punto medio entre resistencia, tiempo y material. Paredes de 0,8 mm se imprimen, pero quedan frágiles en piezas altas.</p>` },
      { h: 'Portalápices o compartimentos rectos', html: `
        <p>La variante portalápices usa huecos circulares. Deja más material entre los huecos, lo que la vuelve muy rígida y pesada: ideal para lápices y pinceles. Los compartimentos rectos aprovechan mejor el espacio para clips, notas o cables.</p>` },
      { h: 'Etiqueta frontal', html: `
        <p>La etiqueta se agrega en relieve sobre la cara frontal. Como sobresale de una pared vertical, la parte de abajo de cada letra es un voladizo pequeño (igual al relieve, de 1 mm por defecto) que cualquier impresora resuelve sin soportes. Si la etiqueta no entra, el editor la ajusta al ancho disponible.</p>` },
      { h: 'Ajustes sugeridos', html: `<ul><li>Capa de 0,2 o 0,28 mm: es una pieza grande y la velocidad importa.</li><li>2 o 3 perímetros y 10-15 % de relleno (solo hay relleno en el fondo).</li></ul>` },
    ],
  },
  {
    slug: 'maceta-geometrica',
    objectId: 'maceta',
    kind: 'Guía de diseño',
    title: 'Maceta geométrica impresa en 3D: diseño, drenaje y materiales',
    description: 'Facetas, giro y conicidad sin necesitar soportes, cómo dimensionar el drenaje y qué filamento usar para una maceta con plantas reales.',
    minutes: 6,
    sections: [
      { h: 'Forma sin soportes', html: `
        <p>Las paredes de una maceta se pueden abrir hacia afuera, pero hasta cierto punto. Más allá de unos 45° desde la vertical, cada capa queda en el aire. El editor revisa cuánta superficie supera ese ángulo y te avisa si va a hacer falta soporte. Combinar mucho giro con pocas caras (por ejemplo, 3 caras y 120°) genera voladizos importantes. Con 5 a 8 caras y hasta 60° de giro, en general no hace falta nada.</p>` },
      { h: 'Pared y fondo', html: `
        <p>2 mm de pared es un buen valor para macetas de 80 a 120 mm de diámetro. En las facetadas, el grosor se mide en forma perpendicular a cada cara, por eso el radio interior se ajusta según la cantidad de caras. El fondo de 3 mm aguanta bien el peso de la tierra húmeda.</p>` },
      { h: 'Drenaje', html: `
        <p>Las plantas reales necesitan drenaje: un agujero de 6 a 10 mm alcanza para una maceta chica. Si la vas a usar adentro de otra maceta (cubremaceta), podés dejarla sin agujero.</p>` },
      { h: 'Material', html: `
        <p>El PLA aguanta bien en interiores, pero con el sol y la humedad se degrada con el tiempo. Para balcones o patios, el PETG y el ASA duran mucho más. Si querés que la maceta retenga agua sin filtraciones entre capas, imprimí con 3 o 4 perímetros y una temperatura de extrusión un poco más alta de lo habitual.</p>` },
      { h: 'Modo jarrón', html: `
        <p>Los laminadores tienen un "modo jarrón" que imprime una sola pared en espiral. Esta maceta tiene pared doble y fondo con agujero, así que no está pensada para ese modo: imprimila en modo normal.</p>` },
    ],
  },
  {
    slug: '3mf-stl-obj-diferencias',
    kind: 'Artículo',
    title: '3MF, STL u OBJ: qué formato descargar para tu impresora 3D',
    description: 'Diferencias reales entre los tres formatos de archivo 3D más usados y cuál conviene según tu laminador y tu impresora.',
    minutes: 4,
    sections: [
      { h: 'STL: el más compatible', html: `
        <p>STL guarda solo triángulos: no tiene unidades, colores ni nombres de piezas. Lo lee cualquier laminador desde hace décadas, y por eso sigue siendo el formato universal. Si tu modelo tiene varias piezas de colores distintos, conviene descargar un STL por pieza para poder asignar un filamento a cada una a mano.</p>` },
      { h: '3MF: pensado para impresión 3D', html: `
        <p>3MF es un paquete comprimido que incluye las mallas, las unidades (milímetros), los nombres de las piezas y sus colores. Bambu Studio, OrcaSlicer, PrusaSlicer y Cura lo abren directamente. En Estratos 3D, cada color se exporta como un componente separado dentro del mismo objeto, ya posicionado sobre la cama.</p>
        <p>Algunos laminadores usan los colores del archivo solo como referencia, y igual te van a pedir elegir qué filamento va en cada pieza. Ese paso tarda unos segundos.</p>` },
      { h: 'OBJ: para otros programas 3D', html: `
        <p>OBJ es un formato de texto muy extendido en programas de modelado y render. Los colores viajan en un archivo .mtl aparte, que tiene que estar en la misma carpeta que el .obj. Para imprimir rara vez es la mejor opción, pero sirve si querés retocar el modelo en Blender u otro programa.</p>` },
      { h: 'Resumen', html: `
        <ul><li>¿Tu laminador abre 3MF? Usá 3MF.</li><li>¿Programa viejo o desconocido? STL.</li><li>¿Vas a editar o renderizar el modelo? OBJ.</li></ul>` },
    ],
  },
  {
    slug: 'imprimir-dos-colores-sin-multicolor',
    kind: 'Artículo',
    title: 'Cómo imprimir a dos colores con una impresora de un solo extrusor',
    description: 'Paso a paso para cambiar de filamento a mitad de la impresión y conseguir texto en otro color sin una impresora multicolor.',
    minutes: 5,
    sections: [
      { h: 'La idea', html: `
        <p>En un diseño con texto en relieve, todo lo que está por encima de cierta altura es texto. Si la impresora pausa justo al empezar esa capa, cambiás el filamento y sigue, el texto sale de otro color. Funciona con cualquier impresora que acepte una pausa o un cambio de filamento en el G-code.</p>` },
      { h: 'Paso a paso', html: `
        <ol>
          <li>En el editor, anotá el grosor de la base: es la altura a la que empieza el texto (3 mm por defecto en el llavero).</li>
          <li>Abrí el archivo en tu laminador y laminalo normalmente.</li>
          <li>En la vista previa de capas, buscá la primera capa que está por encima de esa altura. Con capas de 0,2 mm y base de 3 mm, es la capa que empieza en 3,0 mm.</li>
          <li>Agregá una pausa o un cambio de filamento en esa capa. En PrusaSlicer y OrcaSlicer, el botón "+" junto a la barra de capas inserta un cambio de color. En otros programas podés agregar el comando <code>M600</code> como G-code personalizado.</li>
          <li>Cuando la impresora se detenga, retirá el filamento, cargá el nuevo y purgá hasta que salga limpio. Después reanudá la impresión.</li>
        </ol>` },
      { h: 'Consejos', html: `
        <ul><li>Los colores claros sobre bases oscuras necesitan más purga: el filamento nuevo arrastra restos del anterior.</li><li>Para el acabado incrustado (texto a ras), el color cambia en varias capas seguidas, así que este método no sirve: hace falta una impresora multicolor.</li></ul>` },
    ],
  },
  {
    slug: 'pla-petg-asa-que-material-usar',
    kind: 'Artículo',
    title: 'PLA, PETG o ASA: qué filamento usar para cada objeto',
    description: 'Temperatura, resistencia al sol y facilidad de impresión de los tres filamentos más comunes, con recomendaciones por tipo de objeto.',
    minutes: 4,
    sections: [
      { h: 'PLA', html: `
        <p>Es el más fácil de imprimir: no necesita cama muy caliente, casi no se deforma y viene en muchísimos colores y acabados (seda, mate, madera). Su límite es la temperatura: empieza a ablandarse alrededor de los 55-60 °C. Sirve para llaveros, organizadores, placas de interior y soportes de escritorio.</p>` },
      { h: 'PETG', html: `
        <p>Es más flexible y resistente a los golpes que el PLA, y aguanta más temperatura (unos 75-80 °C). Tolera la humedad y el uso al aire libre mejor que el PLA. Puede dejar hilos finos entre piezas si la retracción no está bien ajustada. Es una buena opción para macetas y soportes que van a estar cerca de una ventana.</p>` },
      { h: 'ASA', html: `
        <p>Resiste la radiación UV y el calor, por eso es el material indicado para carteles y objetos de exterior. Se imprime mejor en impresoras cerradas, porque se contrae al enfriarse, y emite olor durante la impresión, así que conviene ventilar el ambiente.</p>` },
      { h: 'Una advertencia', html: `
        <p>Ningún objeto impreso con FDM es apto para contacto con alimentos solo por el material: las líneas entre capas acumulan restos difíciles de limpiar. Para tazas, platos o moldes de cocina, buscá productos certificados.</p>` },
    ],
  },
];

export const getGuide = (slug) => GUIDES.find((g) => g.slug === slug);
export const guideForObject = (objectId) => GUIDES.find((g) => g.objectId === objectId);
