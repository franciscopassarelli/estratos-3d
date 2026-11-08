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
      <p>Es más flexible y resistente a los golpes que el PLA, y aguanta más temperatura (unos 75-80 °C). Tolera la humedad y el uso al aire libre mejor que el PLA. Es una buena opción para macetas y soportes que van a estar cerca de una ventana.</p>
      <p><strong>Configuración recomendada para imprimir PETG:</strong></p>
      <ul>
        <li><strong>Temperatura de pico:</strong> 230 °C a 245 °C.</li>
        <li><strong>Cama caliente:</strong> 70 °C a 80 °C.</li>
        <li><strong>Ventilador de capa:</strong> 30% a 50% máximo (reducir el enfriamiento mejora la adherencia entre capas).</li>
        <li><strong>Velocidad:</strong> 40 a 60 mm/s (imprimir más lento evita fallas de extrusión).</li>
        <li><strong>Consejo de adhesión:</strong> Usá fijador de pelo o laca sobre la cama para evitar que la pieza se adhiera en exceso y pueda dañar la lámina PEI o el cristal.</li>
      </ul>` },
    { h: 'ASA', html: `
      <p>Resiste la radiación UV y el calor, por eso es el material indicado para carteles y objetos de exterior. Se imprime mejor en impresoras cerradas, porque se contrae al enfriarse, y emite olor durante la impresión, así que conviene ventilar el ambiente.</p>` },
    { h: 'Una advertencia', html: `
      <p>Ningún objeto impreso con FDM es apto para contacto con alimentos solo por el material: las líneas entre capas acumulan restos difíciles de limpiar. Para tazas, platos o moldes de cocina, buscá productos certificados.</p>` },
  ],
},
  {
    slug: 'primera-capa-no-se-pega',
    kind: 'Solución de problemas',
    title: 'La primera capa no se pega a la cama: causas y soluciones',
    description: 'Por qué la primera capa se despega o se arrastra, y cómo resolverlo: nivelación, altura de la boquilla, limpieza de la cama, temperatura y velocidad.',
    minutes: 7,
    sections: [
      { h: 'Por qué importa tanto', html: `
        <p>Todo lo que imprimís se apoya en la primera capa. Si no queda bien adherida, la pieza se mueve, se despega a mitad de camino o termina como una maraña de filamento. La buena noticia es que casi siempre la causa es una de pocas, y se revisan en orden.</p>` },
      { h: '1. La distancia entre la boquilla y la cama', html: `
        <p>Es la causa más común. La primera capa tiene que salir <b>levemente aplastada</b> contra la cama, no apoyada encima.</p>
        <ul>
          <li><b>Boquilla muy alta:</b> el filamento sale como un fideo redondo, se ven espacios entre líneas y se despega con el dedo.</li>
          <li><b>Boquilla muy baja:</b> casi no sale material, la superficie queda transparente o rayada, y en piezas grandes aparece el "pie de elefante" (la base se ensancha hacia afuera).</li>
          <li><b>Bien ajustada:</b> las líneas quedan planas, unidas entre sí y la superficie se siente lisa al tacto.</li>
        </ul>
        <p>Este ajuste se llama <b>Z-offset</b>. La mayoría de las impresoras permite cambiarlo en pasos de 0,01 a 0,05 mm desde la pantalla mientras imprime la primera capa: ajustá de a poco hasta que las líneas se vean como en el último caso.</p>` },
      { h: '2. La cama tiene que estar nivelada', html: `
        <p>Si en una esquina la primera capa sale perfecta y en la opuesta se despega, la cama no está pareja. En impresoras con nivelación manual, el método clásico es pasar una hoja de papel entre la boquilla y la cama en cada esquina y girar las ruedas hasta sentir un roce suave e igual en todas. Hacelo con la cama caliente, porque el metal se dilata. Las impresoras con sensor de nivelación automática compensan pequeñas diferencias, pero el Z-offset igual hay que ajustarlo.</p>` },
      { h: '3. Una cama limpia', html: `
        <p>La grasa de los dedos alcanza para que el plástico no se pegue. Limpiá la superficie con alcohol isopropílico antes de imprimir y evitá tocarla donde va la pieza. Las láminas de PEI texturizado se recuperan muy bien lavándolas con agua tibia y detergente, y secándolas bien.</p>` },
      { h: '4. Temperatura y ventilador', html: `
        <ul>
          <li><b>PLA:</b> cama entre 55 y 65 °C. Si se despega, subila 5 °C.</li>
          <li><b>PETG:</b> cama entre 70 y 85 °C. Ojo: en PEI liso el PETG se pega tanto que puede arrancar parte de la superficie; se recomienda una capa fina de pegamento en barra como separador.</li>
        </ul>
        <p>El ventilador de capa conviene apagado (o muy bajo) en la primera capa. Los laminadores ya lo traen así por defecto, pero vale revisarlo si cambiaste el perfil.</p>` },
      { h: '5. Más lento y más ancho', html: `
        <p>Una primera capa a 15-30 mm/s tiene tiempo de adherirse. Si tu perfil la imprime más rápido, bajala. También ayuda una primera capa un poco más gruesa (0,24-0,3 mm) porque disimula pequeñas imperfecciones de la cama.</p>` },
      { h: '6. Piezas chicas o con esquinas', html: `
        <p>Los llaveros y las piezas con poca superficie de apoyo tienen menos "agarre". Agregá un <b>borde</b> (brim) de 3 a 5 mm en el laminador: es una franja fina alrededor de la base que aumenta la superficie y después se corta con la uña o un cúter. Si el problema es que las esquinas se levantan (warping), también evitá corrientes de aire: una ventana abierta o un ventilador de techo alcanzan para enfriar la pieza de un lado.</p>` },
      { h: 'Lista rápida', html: `
        <ol>
          <li>Ajustá el Z-offset mirando cómo sale la primera capa.</li>
          <li>Comprobá la nivelación en las cuatro esquinas.</li>
          <li>Limpiá la cama con alcohol isopropílico.</li>
          <li>Revisá la temperatura de la cama para tu material.</li>
          <li>Bajá la velocidad de la primera capa.</li>
          <li>En piezas chicas, agregá un borde.</li>
        </ol>
        <p>Si querés probar con una pieza chica y rápida, un <a href="/crear/llavero">llavero con nombre</a> es ideal: en pocos minutos ves cómo quedó la primera capa.</p>` },
    ],
  },
  {
    slug: 'hilos-stringing-impresion-3d',
    kind: 'Solución de problemas',
    title: 'Hilos entre piezas (stringing): cómo eliminarlos',
    description: 'Qué causa los hilos finos que aparecen entre partes de una impresión 3D y cómo eliminarlos con retracción, temperatura y filamento seco.',
    minutes: 6,
    sections: [
      { h: 'Qué son los hilos', html: `
        <p>Cuando la boquilla se mueve de una parte de la pieza a otra sin imprimir, a veces sigue goteando un poco de plástico derretido. Ese plástico se estira y deja hilos finos, como telas de araña, entre las partes. Se nota mucho en textos con letras separadas, en piezas con varias torres o en los huecos de un organizador.</p>` },
      { h: '1. Retracción', html: `
        <p>La retracción hace que el extrusor tire del filamento hacia atrás antes de cada movimiento en vacío, para que la boquilla no gotee. Los valores dependen del tipo de extrusor:</p>
        <ul>
          <li><b>Extrusor directo</b> (el motor está sobre el cabezal): entre 0,5 y 2 mm.</li>
          <li><b>Extrusor Bowden</b> (el filamento viaja por un tubo largo): entre 4 y 7 mm.</li>
        </ul>
        <p>Cambiá de a 0,5 mm por vez. Una retracción excesiva también trae problemas: puede generar huecos al reanudar o trabar el filamento en el hotend.</p>` },
      { h: '2. Temperatura', html: `
        <p>Cuanto más caliente está el plástico, más líquido es y más gotea. Bajar la temperatura de la boquilla entre 5 y 10 °C suele reducir mucho los hilos. La forma más precisa de encontrar el valor justo es imprimir una <b>torre de temperatura</b>: una pieza de prueba que cambia la temperatura cada pocos milímetros. Muchos laminadores, como OrcaSlicer, la traen incorporada en el menú de calibración.</p>` },
      { h: '3. Filamento húmedo', html: `
        <p>Muchos filamentos absorben humedad del ambiente, en especial el PETG y el nylon, y también el PLA con el tiempo. El agua se convierte en vapor dentro de la boquilla y provoca hilos, burbujas y una superficie áspera. La señal más clara: chasquidos o pequeños estallidos mientras imprime.</p>
        <p>Se soluciona secándolo: en un secador de filamento o en un horno que mantenga temperaturas bajas de forma estable, unas 4 a 6 horas a 45-50 °C para PLA y a 60-65 °C para PETG. No uses un horno de cocina común si no podés controlar bien la temperatura: un exceso deforma el carrete o el filamento. Guardalo después en una bolsa hermética con sobres desecantes.</p>` },
      { h: '4. Ajustes de desplazamiento', html: `
        <ul>
          <li><b>Velocidad de desplazamiento alta</b> (150 mm/s o más si tu impresora lo permite): cuanto menos tiempo pasa la boquilla en el aire, menos gotea.</li>
          <li><b>Evitar cruzar perímetros:</b> hace que la boquilla viaje por adentro de la pieza en lugar de cruzar por el aire. En PrusaSlicer y OrcaSlicer se llama así o similar.</li>
          <li><b>Wipe (limpieza):</b> la boquilla se "limpia" moviéndose sobre la pieza antes de levantarse.</li>
        </ul>` },
      { h: 'Si igual quedan algunos', html: `
        <p>Unos pocos hilos muy finos se sacan pasando rápido una pistola de calor (o el aire de un secador de pelo en máximo) a unos centímetros: se contraen y desaparecen. Los más gruesos se cortan con un cúter o una tijera de punta fina.</p>` },
    ],
  },
  {
    slug: 'como-pegar-piezas-impresas-3d',
    kind: 'Artículo',
    title: 'Cómo pegar piezas impresas en 3D: qué adhesivo usar',
    description: 'Adhesivo instantáneo, epoxi, soldadura plástica o acetona: qué conviene para unir piezas de PLA, PETG, ABS o ASA y cómo preparar las superficies.',
    minutes: 6,
    sections: [
      { h: 'Cuándo hace falta pegar', html: `
        <p>A veces una pieza es más grande que la cama de la impresora, o tiene una forma que se imprime mejor en partes (sin soportes y con las capas en la dirección más resistente). Otras veces se rompió y querés repararla. En todos los casos, el resultado depende del adhesivo y, sobre todo, de cómo prepares las superficies.</p>` },
      { h: 'Preparar las superficies', html: `
        <ol>
          <li><b>Probá en seco:</b> las caras tienen que encajar sin forzar. Si hay rebabas o restos de soporte, sacalos primero.</li>
          <li><b>Lijá:</b> una pasada con lija de grano 120 a 220 en las dos caras le da "agarre" al pegamento.</li>
          <li><b>Limpiá:</b> pasá alcohol isopropílico para quitar el polvo y la grasa, y dejá secar.</li>
        </ol>` },
      { h: 'Adhesivo instantáneo (cianoacrilato)', html: `
        <p>Es el clásico pegamento de gota que se consigue en cualquier ferretería o kiosco. Funciona bien con PLA, ABS y ASA, y aceptablemente con PETG. Usá poco: una capa fina pega más que una gruesa. La versión en <b>gel</b> es más cómoda porque no chorrea y deja unos segundos para acomodar la pieza.</p>
        <p>Es rígido, así que no es ideal para uniones que se flexionan o reciben golpes. Si al secar aparece una "neblina" blanca alrededor de la unión, se debe a los vapores del pegamento: usá menos cantidad y ventilá.</p>` },
      { h: 'Epoxi de dos componentes', html: `
        <p>Es la opción más fuerte para uniones que van a hacer fuerza, o cuando las caras no encajan perfecto, porque rellena los huecos. Se mezclan partes iguales de los dos componentes y hay un tiempo para trabajar (5 minutos, 30 minutos o más, según el producto). Funciona con todos los materiales comunes, incluido el PETG, que es el más difícil de pegar. Respetá el tiempo de curado completo que indica el envase antes de exigir la pieza.</p>` },
      { h: 'Soldadura plástica', html: `
        <p>Se trata de fundir las dos caras con el mismo material. Se puede hacer con una lapicera 3D cargada con el mismo filamento o con un soldador de estaño (con una punta que destines solo a esto), pasándolo por la unión y agregando un trozo de filamento como "aporte". La unión queda del mismo material, así que se puede lijar y pintar sin que se note. Hacelo en un lugar ventilado.</p>` },
      { h: 'Acetona: solo para ABS y ASA', html: `
        <p>La acetona disuelve la superficie del ABS y del ASA, así que al apretar dos caras humedecidas se funden en una sola. Una mezcla de acetona con restos del mismo plástico disueltos ("pasta de ABS") rellena huecos. <b>No funciona con PLA ni con PETG.</b> La acetona es inflamable y sus vapores irritan: usala con buena ventilación y lejos de cualquier llama.</p>` },
      { h: 'Mejor que pegar: diseñar para encajar', html: `
        <p>Si vas a imprimir algo en partes, agregá pines y agujeros (dejando unos 0,2-0,3 mm de holgura) o una cola de milano. Así las piezas quedan alineadas solas y el adhesivo solo tiene que mantenerlas en su lugar. Para la mayoría de los objetos de Estratos 3D no hace falta: se imprimen de una sola pieza y el editor elige la orientación para que no necesiten soportes.</p>` },
      { h: 'Resumen', html: `
        <ul>
          <li><b>Rápido y para piezas chicas:</b> adhesivo instantáneo en gel.</li>
          <li><b>Uniones que hacen fuerza o con huecos:</b> epoxi.</li>
          <li><b>Que no se note la unión:</b> soldadura plástica.</li>
          <li><b>ABS o ASA:</b> acetona.</li>
        </ul>` },
    ],
  },
  {
    slug: 'ideas-regalos-imprimir-3d',
    kind: 'Ideas',
    title: 'Ideas de regalos para imprimir en 3D personalizados',
    description: 'Regalos personalizados que se imprimen en 3D en poco tiempo: llaveros con nombre, carteles, macetas, soportes y organizadores, con ideas para cada ocasión.',
    minutes: 5,
    sections: [
      { h: 'Por qué un regalo impreso en 3D', html: `
        <p>Lo que hace especial a un objeto impreso en 3D es que puede llevar el nombre, la medida o el color exacto que querés. Un llavero con un nombre cualquiera se compra en cualquier lado; uno con el apodo de alguien y sus colores favoritos, no. Todas estas ideas se pueden diseñar gratis en Estratos 3D sin saber modelar.</p>` },
      { h: 'Llaveros con nombre', html: `
        <p>Es el regalo impreso más clásico y uno de los más rápidos: suele estar listo en menos de una hora y usa muy poco material.</p>
        <ul>
          <li><b>Souvenirs:</b> para cumpleaños, bautismos o eventos, imprimí varios en una misma tanda con el nombre de cada invitado.</li>
          <li><b>Equipos y grupos:</b> el nombre del equipo, del club o de un torneo.</li>
          <li><b>Mascotas:</b> el nombre de tu perro o gato con un símbolo de corazón o huella.</li>
        </ul>
        <p><a href="/crear/llavero">Diseñá un llavero con nombre</a>.</p>` },
      { h: 'Carteles y placas', html: `
        <ul>
          <li><b>Puerta de la habitación</b> de un chico, con su nombre y un símbolo que le guste.</li>
          <li><b>Consultorio u oficina:</b> nombre, profesión y número de oficina en dos líneas.</li>
          <li><b>Emprendimientos:</b> un cartel chico para el mostrador o la vidriera.</li>
        </ul>
        <p>Con texto en relieve se puede imprimir a dos colores aunque tu impresora tenga un solo extrusor: <a href="/guias/imprimir-dos-colores-sin-multicolor">te explicamos cómo</a>. <a href="/crear/placa">Diseñá una placa</a>.</p>` },
      { h: 'Macetas', html: `
        <p>Una maceta geométrica con una suculenta o un cactus es un regalo que dura. Podés elegir la cantidad de caras, el giro y la forma, y combinarla con un color que vaya con el lugar donde va a estar. <a href="/crear/maceta">Diseñá una maceta</a> y revisá <a href="/guias/maceta-geometrica">la guía de macetas</a> para el drenaje y el material.</p>` },
      { h: 'Para el escritorio', html: `
        <ul>
          <li><b>Soporte para celular</b> a medida del teléfono de quien lo recibe (con funda), ideal para alguien que trabaja desde casa o hace videollamadas. <a href="/crear/soporte-celular">Diseñá un soporte</a>.</li>
          <li><b>Organizador</b> con compartimentos para lápices, clips o herramientas, con el nombre de la persona en el frente. <a href="/crear/organizador">Diseñá un organizador</a>.</li>
        </ul>` },
      { h: 'Consejos para que quede bien', html: `
        <ul>
          <li><b>Elegí bien los colores:</b> el contraste entre la base y el texto hace la diferencia. Blanco sobre negro, negro sobre amarillo o dorado sobre azul oscuro se leen muy bien.</li>
          <li><b>Probá antes:</b> imprimí una primera versión para revisar medidas y legibilidad, sobre todo si vas a hacer muchas copias.</li>
          <li><b>Material según el uso:</b> PLA para interior; PETG o ASA si va a estar al sol. Más en <a href="/guias/pla-petg-asa-que-material-usar">la guía de materiales</a>.</li>
          <li><b>Si no tenés impresora:</b> descargá el archivo 3MF o STL y pedí que te lo impriman en un servicio de impresión 3D de tu zona.</li>
        </ul>` },
    ],
  },
  {
    slug: 'glosario-impresion-3d',
    kind: 'Artículo',
    title: 'Glosario de impresión 3D: los términos que tenés que conocer',
    description: 'Qué significan laminador, perímetros, relleno, voladizo, Z-offset, retracción, brim y otros términos de impresión 3D, explicados en simple.',
    minutes: 8,
    sections: [
      { h: 'La impresora', html: `
        <ul>
          <li><b>FDM:</b> el tipo de impresión 3D más común en casa. Funde un hilo de plástico (filamento) y lo deposita capa por capa.</li>
          <li><b>Extrusor:</b> el mecanismo que empuja el filamento. Puede ser <b>directo</b> (montado sobre el cabezal) o <b>Bowden</b> (el filamento llega por un tubo largo).</li>
          <li><b>Hotend:</b> la parte que calienta y funde el filamento.</li>
          <li><b>Boquilla:</b> la punta por donde sale el plástico. La más común mide 0,4 mm.</li>
          <li><b>Cama:</b> la superficie sobre la que se imprime. Suele ser calefaccionada.</li>
          <li><b>PEI:</b> un material que recubre muchas camas modernas; el plástico se pega bien en caliente y se suelta al enfriarse.</li>
        </ul>` },
      { h: 'Archivos y programas', html: `
        <ul>
          <li><b>STL, 3MF, OBJ:</b> formatos de archivo 3D. Las diferencias están en <a href="/guias/3mf-stl-obj-diferencias">esta guía</a>.</li>
          <li><b>Laminador (slicer):</b> el programa que convierte el modelo 3D en instrucciones para la impresora. Algunos conocidos son PrusaSlicer, OrcaSlicer, Bambu Studio y Cura.</li>
          <li><b>G-code:</b> el archivo de instrucciones que genera el laminador: a dónde moverse, a qué velocidad y cuánto plástico sacar.</li>
          <li><b>Malla cerrada (manifold):</b> un modelo sin agujeros en su superficie. Los laminadores necesitan mallas cerradas para saber qué es "adentro" y qué es "afuera". Los objetos de Estratos 3D se verifican antes de descargarlos.</li>
        </ul>` },
      { h: 'Cómo se construye la pieza', html: `
        <ul>
          <li><b>Altura de capa:</b> el grosor de cada capa. 0,2 mm es el valor estándar; menos da más detalle y tarda más.</li>
          <li><b>Primera capa:</b> la que apoya en la cama. Es la más importante; si falla, falla todo. Ver <a href="/guias/primera-capa-no-se-pega">cómo lograr que se pegue</a>.</li>
          <li><b>Perímetros (paredes):</b> las líneas que forman el contorno de cada capa. Más perímetros, pieza más resistente.</li>
          <li><b>Capas superiores e inferiores:</b> las capas sólidas que cierran la pieza arriba y abajo.</li>
          <li><b>Relleno (infill):</b> la estructura interna, en porcentaje. Entre 15 y 25 % alcanza para la mayoría de los objetos.</li>
        </ul>` },
      { h: 'Formas difíciles', html: `
        <ul>
          <li><b>Voladizo (overhang):</b> una parte que sobresale sin nada debajo. Hasta unos 45° desde la vertical se imprime sin ayuda.</li>
          <li><b>Soportes:</b> estructuras temporales que sostienen los voladizos y después se retiran.</li>
          <li><b>Puente:</b> un tramo horizontal entre dos apoyos. Los puentes cortos se imprimen bien sin soportes.</li>
          <li><b>Orientación:</b> cómo se apoya la pieza en la cama. Cambia la cantidad de soportes, la resistencia y el acabado.</li>
        </ul>` },
      { h: 'Ajustes que vas a tocar', html: `
        <ul>
          <li><b>Z-offset:</b> la distancia fina entre la boquilla y la cama en la primera capa.</li>
          <li><b>Nivelación:</b> dejar la cama a la misma distancia de la boquilla en todos sus puntos.</li>
          <li><b>Retracción:</b> el extrusor tira del filamento hacia atrás para que no gotee durante los desplazamientos.</li>
          <li><b>Falda (skirt):</b> una línea alrededor de la pieza, sin tocarla, que sirve para purgar la boquilla.</li>
          <li><b>Borde (brim):</b> una franja pegada a la base de la pieza que mejora la adherencia; se corta después.</li>
          <li><b>Modo jarrón:</b> imprime una sola pared en espiral continua, sin relleno ni tapa.</li>
        </ul>` },
      { h: 'Problemas comunes', html: `
        <ul>
          <li><b>Warping:</b> las esquinas se levantan porque el plástico se contrae al enfriarse.</li>
          <li><b>Stringing (hilos):</b> hilos finos entre partes de la pieza. Ver <a href="/guias/hilos-stringing-impresion-3d">cómo eliminarlos</a>.</li>
          <li><b>Pie de elefante:</b> la base sale más ancha que el resto, en general por una boquilla demasiado cerca de la cama.</li>
          <li><b>Subextrusión:</b> sale menos plástico del necesario; quedan huecos y paredes débiles.</li>
          <li><b>Atasco:</b> el filamento no pasa por la boquilla, muchas veces por suciedad o por una temperatura demasiado baja.</li>
        </ul>` },
      { h: 'Materiales', html: `
        <ul>
          <li><b>PLA:</b> el más fácil de imprimir, para uso en interiores.</li>
          <li><b>PETG:</b> más resistente al calor y a los golpes.</li>
          <li><b>ASA:</b> resiste el sol; ideal para exterior.</li>
        </ul>
        <p>Comparación completa en <a href="/guias/pla-petg-asa-que-material-usar">la guía de materiales</a>.</p>` },
    ],
  },
  {
    slug: 'porta-capsulas-cafe-imprimir-3d',
    objectId: 'porta-capsulas',
    kind: 'Guía de diseño',
    title: 'Porta cápsulas de café en 3D: medidas, prueba e impresión',
    description: 'Cómo funcionan los porta cápsulas tipo Nespresso impresos en 3D, qué medidas cargar, cómo probar el calce con una pieza chica y cómo imprimirlos y pegarlos.',
    minutes: 6,
    sections: [
      { h: 'Cómo sostiene las cápsulas', html: `
        <p>Una cápsula de café tiene un borde ancho y un cuerpo más angosto que sale de ese borde. Los porta cápsulas del sitio aprovechan esa diferencia: el cuerpo pasa por una ranura y el borde queda atrapado detrás, así que la cápsula cuelga sola y las que están debajo la sostienen.</p>
        <p>La <a href="/crear/porta-capsulas">torre</a> tiene cuatro columnas en una sola pieza y una base de discos apilados. El <a href="/crear/porta-capsulas-corazon">corazón</a> y la <a href="/crear/porta-capsulas-ola">ola</a> son paneles: una lámina de frente con las ranuras y otra de fondo, que se pegan. En esos dos, las cápsulas se cargan por un círculo que hay arriba de cada columna y bajan hasta apoyarse.</p>` },
      { h: 'Las medidas que importan', html: `
        <p>Hay dos medidas: el <b>diámetro del borde</b> y el <b>diámetro del cuerpo junto al borde</b>. Para las Nespresso Original son 37,5 mm y 31 mm, que es lo que viene cargado por defecto. Si usás otra marca, medí una cápsula con un calibre y cambiá los dos valores: el diseño recalcula las ranuras y los bolsillos solo.</p>
        <p>Medí el cuerpo cerca del borde y no en la punta: es la parte que pasa por la ranura. El diseño le suma una holgura al bolsillo y a la ranura para que la cápsula entre y baje sin trabarse, pero esa holgura no compensa una medida mal tomada.</p>` },
      { h: 'Probar antes de imprimir todo', html: `
        <p>El corazón y la ola llevan muchas horas de impresión. Para no arriesgarlas, activá <b>Solo la pieza de prueba</b>: es una columna con lugar para dos cápsulas, con la misma chapa, bolsillo y círculo de carga que el panel completo. Se imprime en un rato.</p>
        <p>Cargá las dos cápsulas por el círculo de arriba y dejalas bajar. Si bajan sin esfuerzo y quedan apoyadas sin bailar, el panel completo va a funcionar. Si se traban, subí un poco el diámetro del cuerpo o del borde, reimprimí la prueba y volvé a probar.</p>` },
      { h: 'Imprimirlo y pegarlo', html: `
        <ul>
          <li><b>Material:</b> PLA alcanza para uso interior. Si la cocina se calienta mucho o el panel queda cerca de la cafetera, mejor PETG.</li>
          <li><b>Paredes:</b> la chapa del frente viene con 2,4 mm por defecto; con menos se vuelve flexible.</li>
          <li><b>Frente y fondo:</b> se imprimen por separado. El frente va boca abajo sobre la cama, así la cara que se ve queda lisa. Pegalos con adhesivo instantáneo en gel o con epoxi, prensando hasta que seque.</li>
          <li><b>Base:</b> el panel entra por una lengüeta en una ranura de la base. Si queda ajustado, la holgura de la base se puede subir de a 0,05 mm.</li>
        </ul>` },
      { h: 'Si una cápsula se traba', html: `
        <p>Lo más común es una impresión que salió con un poco más de material del esperado: las paredes de la ranura quedan más cerca de lo diseñado. Podés pasar una lima fina por el borde de la ranura, o ajustar la compensación de tamaño de tu laminador. Si el problema es solo con una marca de cápsulas, volvé a medirlas: algunas tienen el borde más grueso que las Nespresso.</p>` },
    ],
  },
  {
    slug: 'lampara-led-impresa-3d',
    objectId: 'lampara-led',
    kind: 'Guía de diseño',
    title: 'Lámpara impresa en 3D: estilos, luz LED y encastre',
    description: 'Cómo elegir el estilo de la lámpara, qué luz LED usar sin riesgo, cómo lograr que la pantalla deje pasar la luz y cómo ajustar el encastre con la base.',
    minutes: 6,
    sections: [
      { h: 'Elegir el estilo', html: `
        <p>La lámpara del sitio tiene una base y una pantalla hueca, y se encastran sin pegamento. El estilo decide cómo se ve la luz: <b>ondas apiladas</b>, <b>acanalada</b> y <b>ondulada</b> dan sombras suaves; <b>texturada</b> y <b>globo espiral</b> dibujan puntos o espirales de luz; <b>cuadrada torsionada</b> es más geométrica; <b>hongo</b> y <b>Saturno</b> son más decorativas y llevan sombrero o anillo.</p>
        <p>Cada estilo tiene sus propias opciones, como la torsión, las estrías, la profundidad del relieve o el ancho del anillo. La vista 3D te deja probar todas antes de imprimir.</p>` },
      { h: 'Qué luz usar', html: `
        <p>Usá luces LED. Una lámpara de filamento incandescente o una halógena se calientan lo suficiente como para ablandar el PLA y deformar la pantalla, y eso es un riesgo. Las luces LED a pilas o con cable USB casi no calientan, y por eso son las que el diseño prevé.</p>
        <p>En el editor cargás el <b>diámetro de tu luz LED</b>, de 30 a 70 mm (viene en 42 mm), y la base hace un hueco a medida. Si tu lámpara va enchufada, activá la <b>salida para cable por abajo</b>.</p>` },
      { h: 'Que la luz pase bien', html: `
        <p>La luz atraviesa el plástico, así que el grosor de la pared lo cambia todo. La <b>pared de la pantalla</b> va de 0,8 a 2,4 mm y viene en 1,2 mm: cuanto más fina, más luz deja pasar, pero más frágil queda. Para la pantalla conviene un color claro, como blanco natural: los colores oscuros casi no dejan pasar la luz.</p>
        <p>Para ver el relieve de las ondas o las estrías encendido, probá con una pared de 1 mm. Para una lámpara que se va a mover de lugar o que van a usar chicos, quedate cerca de los 1,6 mm.</p>` },
      { h: 'El encastre con la base', html: `
        <p>La <b>holgura del encastre</b> (0,25 mm por defecto) decide si la pantalla entra justa y se queda en su lugar. Si tu impresora imprime pasada de material y la pantalla no entra, subí la holgura de a 0,05 mm. Si queda floja y se mueve, bajala. Una pantalla bien calzada se levanta con la mano pero no se cae sola.</p>` },
      { h: 'Imprimir la pantalla', html: `
        <ul>
          <li>Con pared de 1,2 mm o menos, pasá el laminador a un solo perímetro y quitá el relleno: la pantalla es hueca y se imprime como una cáscara.</li>
          <li>Una velocidad moderada ayuda a que las ondas y las estrías salgan limpias.</li>
          <li>El estilo Saturno se imprime en piezas que se encastran, y el anillo va de otro color: es lo que lo hace parecer un planeta.</li>
        </ul>` },
    ],
  },
  {
    slug: 'qr-impreso-3d-que-se-lea',
    objectId: 'llavero-qr',
    kind: 'Guía de diseño',
    title: 'Códigos QR impresos en 3D: cómo lograr que se lean bien',
    description: 'Tamaño, contraste, relieve y corrección de errores para un QR impreso en 3D que cualquier celular lea rápido, en llaveros, carteles de mostrador o de Wi-Fi.',
    minutes: 5,
    sections: [
      { h: 'Cómo se forma un QR en 3D', html: `
        <p>Un QR es una grilla de cuadraditos oscuros y claros. En una pieza impresa, los cuadraditos oscuros salen en relieve de un color sobre una base de otro color. El celular lee el contraste entre los dos, así que lo que más cuenta es qué tan distintos se ven.</p>
        <p>El código se genera en tu navegador con el dato que escribas (WhatsApp, teléfono, Instagram o un enlace), y el dato no se envía a ningún servidor.</p>` },
      { h: 'El contraste decide si se lee', html: `
        <p>La combinación que mejor funciona es una base clara y un QR oscuro, que es lo que trae el diseño por defecto: base casi blanca y QR gris muy oscuro. También sirve al revés, pero con algunas cámaras los QR claros sobre fondo oscuro tardan más en leerse. Evitá colores parecidos entre sí, como azul oscuro sobre negro, o dos colores brillantes de igual intensidad.</p>` },
      { h: 'Tamaño y relieve', html: `
        <p>El <b>tamaño del QR</b> va de 18 a 45 mm y viene en 28 mm. Cuanto más datos tiene el código, más cuadraditos hay y más chicos quedan, así que un enlace largo necesita más tamaño que un número de teléfono. Con una boquilla de 0,4 mm, un QR de menos de 25 mm con mucho dato empieza a perder definición.</p>
        <p>El <b>relieve</b> va de 0,4 a 1,5 mm y viene en 0,8 mm. Con eso alcanza para que se vea el contraste: más alto no lo hace leer mejor, y en un llavero se engancha en el bolsillo.</p>` },
      { h: 'Corrección de errores y datos cortos', html: `
        <p>La <b>corrección de errores</b> permite que el QR se lea aunque una parte esté sucia o rayada. En el llavero hay dos niveles: baja, que da un código más simple, y media, que tolera más desgaste pero lo vuelve más denso. Si el llavero va a andar en el bolso todo el día, la media es más segura.</p>
        <p>Una forma fácil de simplificar el QR es acortar el dato: un enlace corto genera menos cuadraditos que uno largo, y el resultado se lee más rápido.</p>` },
      { h: 'Probalo antes de regalarlo', html: `
        <p>Probá el QR con el celular antes de usarlo, y con más de un teléfono si podés: las cámaras viejas son más exigentes. Si no lee, hay tres cosas para revisar en este orden: el contraste, el tamaño y que la primera capa no haya salido deformada.</p>` },
    ],
  },
  {
    slug: 'elegir-color-filamento-objetos-3d',
    kind: 'Artículo',
    title: 'Cómo elegir los colores de un objeto impreso en 3D',
    description: 'Combinaciones de colores para llaveros, carteles y decoración: contraste, acabados mate y seda, y qué tener en cuenta con la luz y el uso exterior.',
    minutes: 5,
    sections: [
      { h: 'Primero el contraste', html: `
        <p>Un texto en relieve se lee por la diferencia entre su color y el de la base, más que por el relieve en sí. Una base oscura con texto claro, o al revés, se lee desde lejos; dos tonos parecidos se leen solo de cerca. Antes de imprimir, mirá la vista 3D del editor achicando la pantalla: si el texto todavía se distingue, va a leerse bien impreso.</p>` },
      { h: 'Combinaciones que funcionan', html: `
        <ul>
          <li><b>Negro con blanco o amarillo:</b> el mayor contraste. Ideal para carteles, placas y códigos QR.</li>
          <li><b>Blanco con azul o verde oscuro:</b> prolijo y fácil de leer. Funciona para consultorios y oficinas.</li>
          <li><b>Rojo con blanco o dorado:</b> clásico de Navidad, para adornos y bastones de caramelo.</li>
          <li><b>Pasteles con un acento oscuro:</b> para llaveros y regalos, con la base clara y el nombre en un tono intenso.</li>
        </ul>` },
      { h: 'Mate, seda y brillo', html: `
        <p>Los filamentos mate disimulan las líneas de capa y las pequeñas imperfecciones, y son buenos para carteles y organizadores. Los de acabado seda tienen brillo metálico y destacan en adornos y llaveros, pero muestran más las marcas de las capas. Los filamentos con brillo o purpurina quedan muy bien en decoración, y no conviene usarlos en piezas con texto fino, porque el brillo distrae.</p>` },
      { h: 'Colores y luz', html: `
        <p>En una <a href="/guias/lampara-led-impresa-3d">lámpara</a>, la pantalla tiene que ser clara para que pase la luz: el blanco natural y los pasteles dejan ver el relieve encendido. Los colores intensos tapan la luz. Para la base podés usar un color más oscuro sin problema.</p>` },
      { h: 'Exterior y calor', html: `
        <p>Al sol, los colores oscuros se calientan más que los claros, y el PLA se deforma antes. Para carteles de exterior conviene ASA o PETG en colores claros o medios. Más datos sobre cada material en <a href="/guias/pla-petg-asa-que-material-usar">PLA, PETG o ASA</a>.</p>` },
    ],
  },
  {
    slug: 'calibrar-impresora-piezas-que-encastran',
    kind: 'Artículo',
    title: 'Piezas que encastran: cómo calibrar la impresora y ajustar la holgura',
    description: 'Por qué un encastre sale justo o flojo según la impresora, cómo medir cuánto material de más pone la tuya y cómo corregirlo con la holgura del editor.',
    minutes: 6,
    sections: [
      { h: 'Por qué una pieza no entra aunque el modelo esté bien', html: `
        <p>El modelo 3D tiene las medidas exactas, pero la impresora no. Cada máquina deposita un poco más o un poco menos de material del que debería, y las capas de abajo se aplastan apenas contra la cama. El resultado es que los agujeros salen algo más chicos y las espigas algo más gruesas que en el diseño. Por eso los encastres llevan una <b>holgura</b>: un espacio extra que absorbe esa diferencia.</p>
        <p>Si tu impresora está bien calibrada, la holgura que viene por defecto funciona. Si no, una pieza puede quedar clavada o bailando.</p>` },
      { h: 'Una prueba de 10 minutos para conocer tu máquina', html: `
        <p>Imprimí un cuadrado de 20 × 20 mm y 5 mm de alto, y otro con un agujero cuadrado de 20 mm. Medí los dos con un calibre: si el cuadrado mide 20,2 y el agujero 19,8, tu impresora tiene unos 0,2 mm de más por lado. Ese número es el que tenés que tener en cuenta para la holgura.</p>
        <p>Con un material y una boquilla constantes el valor se repite pieza tras pieza. Anotalo para cada filamento, porque cambia entre PLA y PETG.</p>` },
      { h: 'Qué ajustar en la impresora', html: `
        <ul>
          <li><b>Flujo (extrusión):</b> si las piezas salen siempre pasadas de medida, bajá el flujo de a 2 o 3 % y repetí la prueba.</li>
          <li><b>Primera capa:</b> si el borde de abajo se ensancha, es el efecto de la primera capa aplastada. Subí un poco la altura del cabezal o activá la compensación de ese efecto en el laminador.</li>
          <li><b>Temperatura:</b> con demasiada temperatura el plástico se expande al salir. Probá bajar 5 °C.</li>
          <li><b>Compensación horizontal:</b> algunos laminadores tienen una opción que achica o agranda todos los perfiles unas décimas de milímetro. Sirve para corregir un error constante.</li>
        </ul>` },
      { h: 'Ajustar la holgura desde el editor', html: `
        <p>Varios diseños traen una holgura que podés cambiar: la <a href="/crear/lampara-led">lámpara</a> (encastre de la pantalla), el <a href="/crear/cartel-deslizante">cartel deslizante</a> (corredera), el <a href="/crear/display-qr">display QR</a> y el <a href="/crear/cartel-wifi">cartel Wi-Fi</a> (ranura de la base), el <a href="/crear/soporte-notebook">soporte de notebook</a> y los <a href="/crear/porta-capsulas-corazon">porta cápsulas</a> (lengüeta de la base).</p>
        <p>La regla es simple: si la pieza no entra, subí la holgura de a 0,05 mm; si queda floja, bajala. Hacé un cambio por vez e imprimí solo la pieza del encastre, no el objeto completo.</p>` },
      { h: 'Probar solo la parte que encastra', html: `
        <p>Imprimir un objeto de 8 horas para descubrir que el encastre no entra es la forma más cara de aprender. Cuando el diseño lo permite, imprimí primero una pieza de prueba: los porta cápsulas la traen incluida. Si no, escalá a la mitad de alto o imprimí solo la zona del encastre.</p>
        <p>Con el material equivocado también cambian los resultados: el PETG se estira más que el PLA y suele pedir un poco más de holgura. Más detalles en <a href="/guias/pla-petg-asa-que-material-usar">PLA, PETG o ASA</a>.</p>` },
    ],
  },
  {
    slug: 'texto-en-relieve-impresion-3d',
    kind: 'Artículo',
    title: 'Texto en relieve en 3D: cómo evitar que salga sucio o ilegible',
    description: 'Tamaño mínimo de letra, tipografías, altura del relieve y ajustes del laminador para que los textos de llaveros, placas y carteles salgan nítidos.',
    minutes: 6,
    sections: [
      { h: 'El límite lo pone la boquilla', html: `
        <p>Una boquilla de 0,4 mm deposita líneas de unos 0,4 a 0,5 mm de ancho. Un trazo de letra más fino que dos de esas líneas, o sea menos de 0,8 mm, no se puede imprimir bien y sale cortado o con huecos. Por eso el editor avisa cuando un trazo del texto queda por debajo de ese valor.</p>
        <p>En la práctica: elegí una tipografía con trazo grueso, o aumentá la altura de las letras hasta que los trazos más finos superen ese límite.</p>` },
      { h: 'Tamaño de letra recomendado', html: `
        <ul>
          <li><b>Letras de carteles y placas:</b> entre 12 y 25 mm de altura se leen cómodas a un par de metros.</li>
          <li><b>Llaveros:</b> entre 9 y 14 mm de altura de mayúscula, como en la <a href="/guias/llavero-con-nombre">guía del llavero</a>.</li>
          <li><b>Textos secundarios:</b> no bajes de 6 a 7 mm de altura, y usá una tipografía sin trazos finos.</li>
        </ul>` },
      { h: 'Tipografía y relieve', html: `
        <p>Las tipografías de trazo grueso como Archivo Black, Titan One o Bungee son las que mejor salen. Las cursivas finas, como una caligrafía, necesitan un tamaño mayor porque sus trazos más delgados se pierden. Pacifico funciona bien si la altura es de 11 mm o más.</p>
        <p>La <b>altura del relieve</b> de 0,8 a 1,2 mm es suficiente para que se vea y se sienta. Más alto no mejora la lectura y hace que el texto se enganche o se rompa con un golpe.</p>` },
      { h: 'Relieve, grabado o a dos colores', html: `
        <p>El <b>relieve</b> es lo más fácil de imprimir y de leer. El <b>grabado</b> (hundido) funciona con una profundidad de 0,6 a 1 mm y se lee mejor con un color de base muy distinto del fondo. La opción <b>a dos colores</b> pide un cambio de filamento a la altura donde empieza el texto, y es la que más destaca; el panel de impresión del editor indica a qué altura va.</p>` },
      { h: 'Ajustes del laminador', html: `
        <ul>
          <li>Altura de capa de 0,12 a 0,16 mm para que las curvas de las letras salgan más suaves.</li>
          <li>Velocidad baja en las capas de texto, de 30 a 40 mm/s, para que no se corten las esquinas.</li>
          <li>Retracción bien calibrada: si ves hilitos entre las letras, mirá la guía de <a href="/guias/hilos-stringing-impresion-3d">hilos y stringing</a>.</li>
        </ul>` },
    ],
  },
  {
    slug: 'vender-llaveros-personalizados-3d',
    kind: 'Artículo',
    title: 'Vender llaveros y objetos personalizados impresos en 3D: por dónde empezar',
    description: 'Cómo calcular costos, elegir qué productos ofrecer, ordenar los pedidos y mantener la calidad si querés vender piezas personalizadas hechas con una impresora 3D.',
    minutes: 7,
    sections: [
      { h: 'Empezar con pocos productos', html: `
        <p>Los objetos personalizados que más se piden son los de impresión corta: llaveros con nombre, adornos de Navidad con nombre, posavasos y carteles chicos. Se imprimen en menos de una hora y varios entran en la misma cama. Elegí dos o tres diseños del <a href="/catalogo">catálogo</a>, probalos hasta que salgan bien siempre y recién entonces sumá otros.</p>` },
      { h: 'Calcular cuánto cuesta cada pieza', html: `
        <p>El costo tiene tres partes. El <b>filamento</b>: el laminador te dice cuántos gramos usa la pieza, y los multiplicás por el precio del gramo de tu bobina. La <b>electricidad y el desgaste</b> de la máquina, que se calcula por hora de impresión. Y tu <b>tiempo</b>: preparar el archivo, cambiar el filamento, limpiar y empaquetar.</p>
        <p>Sumá siempre un margen para piezas fallidas: aunque la impresora ande bien, algunas impresiones se pierden. Un cálculo prolijo evita vender a pérdida sin darte cuenta.</p>` },
      { h: 'Ordenar los pedidos', html: `
        <p>Antes de imprimir, confirmá con el cliente el texto exacto, el color y la cantidad, preferentemente por escrito. Un nombre mal escrito obliga a reimprimir. Mandale al cliente una captura de la vista 3D del editor, o usá el botón Foto, para que vea la pieza antes de aprobarla: es la forma más simple de evitar malentendidos.</p>` },
      { h: 'Calidad constante', html: `
        <ul>
          <li>Imprimí siempre con el mismo filamento y la misma configuración para cada producto, así todas las piezas se ven iguales.</li>
          <li>Revisá cada pieza antes de entregarla: quitá rebabas, controlá que el texto esté completo y que la argolla no tenga hilitos.</li>
          <li>Si usás dos colores, probá el cambio de filamento: ver <a href="/guias/imprimir-dos-colores-sin-multicolor">imprimir a dos colores sin multicolor</a>.</li>
        </ul>` },
      { h: 'Cuidar la presentación', html: `
        <p>Una bolsita con una tarjeta chica o una etiqueta con tu contacto cambia la percepción del producto, y los clientes lo recomiendan. Sacá fotos buenas con luz natural y fondo liso: es lo que decide si alguien te escribe o no. Si el objeto va a usarse mucho, aclará el material: el PLA no aguanta el calor de un auto al sol.</p>` },
    ],
  },
];

export const getGuide = (slug) => GUIDES.find((g) => g.slug === slug);
export const guideForObject = (objectId) => GUIDES.find((g) => g.objectId === objectId);