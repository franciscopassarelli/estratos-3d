// Texto de cada diseño: para qué sirve y un consejo de impresión o armado. Lo usa la página del editor
// (src/ui/editor.js) y queda en el HTML que genera el prerender, así que lo leen los buscadores y AdSense.

export const INFO = {
  llavero: {
    uso: 'Un llavero con tu nombre o una palabra corta es el regalo más simple de hacer en 3D y se imprime en menos de una hora. Elegís la tipografía, el tamaño de las letras y el estilo: el texto puede salir en relieve sobre una base, grabado en ella o incrustado a dos colores, y podés sumarle un símbolo a la izquierda. La argolla se calcula sola alrededor del texto, con una pared que no se rompe al usarlo.',
    tip: 'Para el texto en relieve conviene una altura de entre 0,8 y 1,2 mm: se siente al tacto y no se engancha en el bolsillo. Si lo hacés a dos colores, el cambio de filamento se programa en la altura de la base; en el laminador alcanza con agregar una pausa en esa capa.',
  },
  placa: {
    uso: 'Una placa para la puerta de una oficina, el escritorio, un consultorio o el frente de un local. Escribís una línea principal y, si querés, una segunda, y elegís el contorno, el marco elevado, los símbolos a los lados y si va colgada con agujeros o apoyada. El texto se ajusta al ancho de la placa para que siempre entre completo.',
    tip: 'Las placas largas son planas y finas, así que se imprimen sin soportes y sin dificultad. Si va a colgar de un clavo o un tornillo, dejá el agujero para colgar activado y usá un grosor de 4 mm o más para que no se doble con el tiempo.',
  },
  'soporte-celular': {
    uso: 'Un soporte de escritorio hecho con una sola cinta que sube por atrás en una curva y sostiene el celular inclinado. El respaldo puede ser liso, con ranuras, con ondas, con la silueta de una manzana o de un robot, o con tu nombre grabado. Se calcula el espacio para el celular con funda y hay un paso para el cable de carga, así podés usarlo enchufado.',
    tip: 'Se imprime acostado de costado, así la cinta queda con las capas en el sentido de la curva y aguanta el peso sin partirse. Medí el celular con la funda puesta y cargá ese espesor en la opción de espacio: si queda justo, el teléfono no se mueve; si queda flojo, se cae hacia adelante.',
  },
  organizador: {
    uso: 'Una caja con compartimentos para ordenar el escritorio: lapiceras, clips, memorias, cables cortos. Elegís cuántas columnas y filas de compartimentos, el ancho, la profundidad y el alto, y podés ponerle una etiqueta al frente con el nombre. También sirve como portalápices en grilla si lo hacés más alto y con celdas chicas.',
    tip: 'Las paredes de 1,6 a 2 mm alcanzan para uso de escritorio y ahorran bastante material y tiempo. Para llenarlo de cosas pesadas, como tijeras o reglas de metal, subí el grosor del fondo a 3 mm.',
  },
  maceta: {
    uso: 'Una maceta para suculentas, cactus o plantas chicas con la superficie que prefieras: facetada, ondulada o lisa. Controlás la cantidad de caras o de ondas, cuánto giran de abajo hacia arriba, el diámetro de arriba y de abajo, el alto, y si lleva agujero de drenaje. El giro hace que el diseño parezca más complejo de lo que es de imprimir.',
    tip: 'Si usás el agujero de drenaje, poné abajo un plato para que no se manche la mesa. Para que no se filtre agua por las paredes en el uso diario, imprimila con 3 perímetros; una maceta de interior con tierra húmeda dura mucho en PETG, y en PLA también si no está al sol directo todo el día.',
  },
  'display-qr': {
    uso: 'Un cartel de mostrador con un código QR en relieve para que tus clientes te paguen con un link de pago, vean tu alias, abran tu Instagram o te escriban por WhatsApp. El QR se genera con lo que escribas, la placa es de un color y el código de otro, y se apoya sobre una base con una ranura inclinada hacia atrás para que se lea de frente.',
    tip: 'Probá siempre el QR con el celular antes de dejarlo en el local. Funciona mejor con colores de mucho contraste, por ejemplo placa negra y código blanco, y con corrección de errores media o alta si el cartel va a ensuciarse con el uso.',
  },
  'cartel-wifi': {
    uso: 'Una placa de mesa con un código QR que conecta el celular al Wi-Fi sin escribir la clave. Cargás el nombre de la red, el tipo de seguridad y la contraseña, y el diseño arma el QR en el formato que leen los celulares; además muestra el nombre de la red en letras visibles y un ícono de señal en relieve. Sirve para cafés, consultorios, oficinas y alquileres temporarios.',
    tip: 'Si no querés que la clave quede escrita para cualquiera, dejá apagada la opción de escribirla en el cartel: el QR funciona igual. Probá el cartel con un celular antes de usarlo y reimprimilo si cambiás la contraseña del router.',
  },
  'llavero-qr': {
    uso: 'Un llavero compacto con un QR que abre tu WhatsApp, un teléfono, tu Instagram o cualquier enlace, y el nombre grabado al dorso. Es una tarjeta de presentación que se lleva en el bolso: ideal para emprendimientos, mascotas con un contacto de emergencia o souvenirs de eventos. La argolla está reforzada para que aguante el tirón.',
    tip: 'Elegí un tamaño de QR de al menos 30 mm de lado para que cualquier celular lo lea rápido. Con textos o enlaces largos el código se vuelve más denso: acortá el enlace antes de generarlo para que el QR salga más simple y más fácil de leer.',
  },
  posavasos: {
    uso: 'Un set de posavasos con borde y un canal que junta las gotas de condensación, para que no se mojen los muebles. Elegís el contorno, el tamaño, un patrón geométrico de fondo y un nombre o iniciales al centro, en relieve o grabados. Podés imprimir varios en la misma cama y sumar un soporte para guardarlos apilados.',
    tip: 'Imprimí con el relieve del patrón para arriba y, si usás dos colores, programá el cambio en la capa donde empieza el patrón. El canal anti-goteo necesita una profundidad de 1 a 1,5 mm para que sea útil sin acumular suciedad.',
  },
  'bandeja-cajon': {
    uso: 'Bandejas organizadoras a la medida exacta de tu cajón. Cargás el ancho y la profundidad del interior, elegís en cuántos módulos dividirlo y la grilla de compartimentos de cada uno, y el diseño calcula todo con una holgura para que entren sin trabarse. Sirve para cubiertos, herramientas, papelería, maquillaje o cables.',
    tip: 'Medí el cajón por dentro, de pared a pared, no por fuera. Como cada módulo tiene que entrar en la cama de impresión, el diseño te deja dividir el cajón en varias piezas que se acomodan una al lado de la otra y se descargan por separado.',
  },
  'soporte-auriculares': {
    uso: 'Un stand vertical para colgar la vincha de tus auriculares y despejar el escritorio. Tiene un apoyo curvo, una base ancha que no se vuelca y tu nombre o gamertag en relieve o grabado sobre el mástil. Podés ajustar el alto total, el ancho del apoyo y la curva para que calcen auriculares grandes de gamer o los más livianos de oficina.',
    tip: 'Se imprime acostado y sin soportes, con las capas en el sentido que más resiste el peso de la vincha. Para auriculares pesados usá un grosor de apoyo de 5 mm o más y relleno del 20 % como mínimo.',
  },
  'soporte-mandos': {
    uso: 'Una base inclinada para guardar joysticks de PlayStation, Xbox o Switch Pro parados y recostados, con separadores entre cada lugar y una etiqueta al frente. Elegís cuántos mandos, el ancho de cada lugar, la inclinación del respaldo y el alto del frente, así el mando queda a la vista y se saca con una mano.',
    tip: 'Medí el espesor de tu mando más grande, con la funda de silicona si la usa, y cargalo en la opción de espesor del mando apoyado. Se imprime parado y sin soportes; si la inclinación es mayor a 20° conviene un relleno del 20 % para que no se flexione.',
  },
  'soporte-notebook': {
    uso: 'Un soporte de escritorio para guardar la notebook o la tablet parada y liberar lugar. La ranura se calcula con el grosor de tu equipo cerrado, con o sin funda, y podés tener hasta tres lugares en el mismo soporte, por ejemplo la notebook, la tablet y un cuaderno.',
    tip: 'Medí el grosor del equipo en el punto más ancho, incluyendo la funda o la carcasa. Una holgura de 1 a 2 mm deja que entre y salga sin esfuerzo sin que se mueva; si la ranura queda muy ajustada, la funda se rayará al sacarla.',
  },
  'cartel-deslizante': {
    uso: 'Una placa para puertas con una ventana y una corredera que muestra una de dos palabras: Libre y Ocupado, Abierto y Cerrado, Adentro y Afuera o las que quieras. Son dos piezas que se imprimen planas: la placa con la ventana y la corredera con las dos palabras. Tiene agujeros opcionales para atornillarla a la puerta.',
    tip: 'La holgura de la corredera es lo que decide si desliza bien. Con 0,3 a 0,4 mm suele ir justa en la mayoría de las impresoras; si tu máquina imprime pasada de material, subila a 0,5 mm. Probá primero con las dos piezas sin pegar nada.',
  },
  'adorno-navidad': {
    uso: 'Un adorno para el árbol o para colgar en los regalos con un nombre en relieve a dos colores: bola, estrella, árbol, campana o etiqueta. El texto se ajusta solo a la forma que elijas, así un nombre largo o uno corto quedan bien. Es una forma rápida de personalizar la mesa de Navidad o de regalar algo hecho a medida.',
    tip: 'Tarda menos de una hora. Para que el nombre se destaque, usá un color oscuro para la base y uno claro para el texto, o al revés. Si los hacés para toda la familia, imprimí varios en la misma cama cambiando solo el texto.',
  },
  'estrella-arbol': {
    uso: 'Una estrella para la punta del árbol de Navidad, facetada o calada con ventanas, con un soporte que se ata a la rama de arriba. Elegís el tamaño de punta a punta y la cantidad de puntas, de cinco para la clásica a más puntas para una más decorativa.',
    tip: 'Medí el tamaño de tu árbol: una estrella de 120 a 160 mm de punta a punta queda bien en la mayoría de los árboles de living. Si la ponés sobre luces LED, el estilo calado deja pasar la luz y se ve más lindo de noche.',
  },
  'copo-nieve': {
    uso: 'Un copo de nieve de seis brazos para colgar en el árbol, la ventana o una guirnalda. Cada número de semilla genera un copo distinto, así que podés hacer una colección de copos únicos. Elegís el diámetro, cuántas ramitas tiene cada brazo y el grosor de las líneas.',
    tip: 'Imprimilo en blanco, celeste o plateado, y colgalo con hilo de pescar para que parezca flotar. Es de los diseños más rápidos: con 20 a 40 minutos por copo, podés llenar una cama con varios y sacar un árbol entero.',
  },
  servilletero: {
    uso: 'Un aro para servilletas con pinos calados alrededor, pensado para la mesa de Navidad. Elegís el diámetro, el alto, la cantidad de aros que querés imprimir y el tamaño de los árboles. Uno de cada color queda lindo en una mesa grande.',
    tip: 'Medí tu servilleta enrollada para elegir el diámetro: 45 a 50 mm sirve para la mayoría de las servilletas de tela. Los bordes lisos arriba y abajo le dan firmeza y evitan que el calado se rompa al sacarlo.',
  },
  'arbol-conico': {
    uso: 'Un pino cónico con ondas que giran hacia la punta, pensado para imprimir en modo vaso, o sea en una sola pasada continua. Elegís el alto, el diámetro de la base, cuántas ondas, qué profundidad tienen y cuánto giran. Con varios de distintos tamaños y colores armás un bosque para la mesa.',
    tip: 'En modo vaso (también llamado modo espiral) el laminador imprime una pared única sin interrupciones, lo que da una superficie muy limpia. Configurá una sola pared y sin relleno ni capas superiores; el diseño ya está pensado para eso.',
  },
  'organizador-controles': {
    uso: 'Una caja para dejar a mano los controles remotos del televisor, el aire y la consola, con extremos redondeados y el borde en pendiente: más alto atrás y más bajo adelante, para sacarlos sin esfuerzo. Podés sumar una fila delantera para cosas chicas, como pilas o anteojos.',
    tip: 'Elegí la cantidad de compartimentos según tus controles: uno por control más uno para las pilas. Con paredes de 2 mm y un fondo firme aguanta bien el uso diario sin necesidad de pegar nada.',
  },
  'llavero-pared-panal': {
    uso: 'Un panal de hexágonos para colgar en la entrada, con ganchos de otro color para las llaves. Elegís cuántas columnas y filas, cuántos ganchos y su largo, y podés activar una forma irregular que saca algunas celdas del borde y cambia con la semilla, para que cada panal sea distinto.',
    tip: 'Se cuelga con tornillos y tarugos usando los agujeros que trae el diseño. Si lo vas a cargar con muchas llaves o con un llavero pesado, sumá tornillos en las celdas de arriba y usá un grosor de panal de 4 mm o más.',
  },
  'portalapices-panal': {
    uso: 'Un portalápices con celdas hexagonales para lápices, marcadores, tijeras y reglas, más altas en el centro y más bajas en el borde, como un panal. Cada celda es un compartimento aparte, así que los lápices no se mezclan con las tijeras.',
    tip: 'Con dos o tres anillos de celdas ya tenés un portalápices grande. Imprimilo con las paredes de 1,6 mm si querés que sea liviano o de 2,4 mm si lo vas a usar para tijeras y otras cosas pesadas.',
  },
  'florero-low-poly': {
    uso: 'Un florero facetado con triángulos, de estilo low poly, con la panza y el cuello a elección. Controlás los lados, las filas de facetas, el giro, el alto y el diámetro de la base. Se puede imprimir hueco, de manera normal, o sólido para el modo vaso, y se usa con flores secas o con un frasco de vidrio adentro.',
    tip: 'La versión hueca no es hermética: si querés agua, poné un frasco o un tubo de vidrio adentro, o usá flores secas o artificiales. La versión sólida para modo vaso imprime más rápido y tiene un acabado más limpio.',
  },
  'lampara-led': {
    uso: 'Una lámpara de mesa de dos piezas: una base con lugar para una luz LED, a pilas o de cable, y una pantalla hueca. Podés elegir entre ondas apiladas, acanalada, cuadrada torsionada, hongo o Saturno con anillo. La luz atraviesa el plástico fino y deja ver el relieve.',
    tip: 'Usá siempre luz LED fría al tacto: no pongas una lámpara incandescente adentro, porque el plástico se deforma. Para que la luz pase bien, imprimí la pantalla con un solo perímetro, un color claro, como blanco natural, y sin relleno.',
  },
  'tachito-tapa': {
    uso: 'Un tachito de escritorio para los papelitos, con textura de facetas, un aro de otro color y una tapa que gira para tirar los residuos. Se imprime en tres piezas y la tapa se encastra a presión, sin pegamento ni tornillos.',
    tip: 'Es de los diseños más largos de imprimir: calculá entre 6 y 10 horas. Probá la tapa antes de sacar las otras piezas de la cama, y si encastra muy dura, lijala suavemente en el borde o subí un poco la holgura.',
  },
  botellero: {
    uso: 'Un botellero con forma de ola: una cinta ondulada con una cuna para cada botella, que queda trabada entre la vuelta y la loma y no rueda. Elegís cuántas botellas y su diámetro, así sirve para vino, aceite, agua o cerveza. Ocupa muy poco espacio y se ve como un objeto de decoración.',
    tip: 'Medí el diámetro de tus botellas, que suele ser de 75 a 80 mm para vino. Se imprime acostado, sin soportes, y aguanta bien el peso de varias botellas porque las capas siguen la curva de la cinta.',
  },
  'organizador-maquillaje': {
    uso: 'Una bandeja para paletas y labiales con tubos hexagonales escalonados para pinceles, más altos atrás y más bajos adelante. Elegís cuántos tubos por fila, cuántas filas y la altura de cada una, para que cada pincel se vea y se pueda sacar con facilidad.',
    tip: 'Medí tus pinceles más gruesos para elegir el ancho de cada tubo. Una profundidad de bandeja de 60 a 90 mm alcanza para paletas de sombras y estuches chicos; si querés más lugar, sumá otra fila.',
  },
  'organizador-labiales': {
    uso: 'Una columna de celdas en rombo para guardar labiales, delineadores y otras cosas chicas. Elegís el diámetro de lo que guardás, la cantidad de columnas y de filas, la profundidad, y si el fondo va cerrado para que no se caigan hacia atrás.',
    tip: 'Medí el diámetro del labial más ancho y sumale 2 mm. Con el fondo cerrado el organizador se puede apoyar contra la pared sin que se caigan los productos.',
  },
  'posavasos-monstera': {
    uso: 'Un set de posavasos con forma de hoja de monstera, con nervadura y calados, que se ven como una planta de interior. Elegís el tamaño, el ancho de la hoja, cuántos calados por lado y cuántos hacer, y lo imprimís todo junto en una sola cama.',
    tip: 'Un verde oscuro les da el aspecto más realista, aunque queda lindo en cualquier color. Son planos y finos, así que se imprimen en media hora cada uno y sin soportes.',
  },
  'llavero-articulado': {
    uso: 'Un llavero con las letras de tu nombre paradas y unidas por bisagras que giran, así el nombre se dobla como una víbora. Se imprime ya armado, sin soportes ni pegamento, y a dos colores con un solo cambio de filamento.',
    tip: 'El juego de las bisagras es lo más importante: con 0,3 a 0,4 mm giran libres en la mayoría de las impresoras. Después de imprimir, movelas varias veces con la mano para soltarlas del todo.',
  },
  'llavero-placa': {
    uso: 'Una placa cuadrada con tres líneas de texto enmarcadas en un círculo y un detalle abajo, pensada para marcas, emprendimientos y souvenirs. Se hace a dos colores: placa de un color y relieve de otro. Cargás la línea de arriba, la principal y la de abajo, y elegís el detalle.',
    tip: 'Para que se lea bien, usá un color oscuro para la placa y uno claro para el texto. Los textos largos se achican para entrar en el círculo, así que conviene dejar la línea principal corta.',
  },
  'llavero-lettering': {
    uso: 'Un llavero con dos palabras en letra cursiva, como un sticker: una chica arriba y una grande abajo, con un detalle y un subrayado curvo. La base tiene el contorno de las letras y el texto va a dos colores, así que parece un lettering hecho a mano.',
    tip: 'Probá tipografías cursivas gruesas, que salen más resistentes. Si tu impresora tiene una sola boquilla, activá la opción pensada para eso, que organiza el diseño para un solo cambio de filamento.',
  },
  'llavero-inicial': {
    uso: 'Un llavero con la inicial bien grande y el nombre completo en relieve adentro. El nombre se acomoda solo en el lugar donde entra mejor. Se hace a dos colores y queda lindo como regalo de cumpleaños, para el bolso o para colgar en la mochila de los chicos.',
    tip: 'Elegí una tipografía gruesa para la inicial: las letras finas tienen menos lugar para el nombre. Un nombre de hasta 8 o 9 letras se lee bien; con nombres más largos, achicá la altura del relieve.',
  },
  'porta-capsulas': {
    uso: 'Una torre de cuatro columnas para cápsulas de café tipo Nespresso: cada cápsula se cuelga del borde y baja sola por la columna. La base es redonda, de discos apilados en otro color. Elegís cuántas cápsulas por columna y ajustás el diámetro del borde y del cuerpo para tu marca de cápsulas.',
    tip: 'Las Nespresso Original miden unos 37,5 mm de borde y 31 mm de cuerpo junto al borde. Si usás otra marca, medí una cápsula y cargá esos valores, que se calcula todo para que entren sin trabarse.',
  },
  'porta-capsulas-corazon': {
    uso: 'Un panel con forma de corazón para exhibir cápsulas de café tipo Nespresso. Cada columna guarda las cápsulas apiladas y se cargan por el círculo de arriba; las cápsulas quedan a la vista en una ranura con la base mirando hacia afuera. Se imprime en dos láminas que se pegan, sobre una base con ranura.',
    tip: 'Antes de imprimir el corazón entero, imprimí la pieza de prueba: una columna con lugar para dos cápsulas, con las mismas medidas. Si entran por el círculo de arriba y bajan sin trabarse, el corazón completo va a andar. Pegá las dos láminas con adhesivo instantáneo o epoxi.',
  },
  'porta-capsulas-ola': {
    uso: 'Un panel de bordes ondulados para cápsulas de café tipo Nespresso, con columnas de cápsulas apiladas que se cargan por el círculo de arriba. Elegís cuántas columnas, cuántas cápsulas por columna y si la última columna va más corta. Se imprime en dos láminas que se pegan, sobre una base redondeada con ranura.',
    tip: 'Con 6 cápsulas por columna el panel mide unos 280 mm de alto: verificá que tu cama de impresión lo permita o bajá la cantidad. Imprimí primero la pieza de prueba para comprobar que las cápsulas calcen y recién después el panel completo.',
  },
  'caja-panuelos': {
    uso: 'Una caja redonda con ondas y estrías finas, con tapa y un agujero o una ranura para sacar los pañuelos. Entra un rollo de papel de centro o un paquete de pañuelos. Son dos piezas en dos colores.',
    tip: 'Medí el diámetro del rollo o del paquete que usás y sumale 2 o 3 mm. Para que la tapa no se salga al tirar de un pañuelo, dejá el encastre justo y probalo antes de pegar nada.',
  },
  'botellero-copas': {
    uso: 'Un botellero con celdas en rombo para botellas paradas, que se apoya en una punta con cuatro botellas o sobre dos patas con tres. Arriba tiene dos brazos en X con ranuras para colgar copas de pie, y las caras de arriba pueden ser acanaladas.',
    tip: 'Medí el diámetro de tus botellas y el grosor del tallo de las copas, que suele ser de 6 a 8 mm. Es una impresión larga, de 10 a 16 horas, que se hace acostada y sin soportes.',
  },
  'galleta-jengibre': {
    uso: 'Un muñequito de jengibre con carita, botones y moño en relieve, para colgar en el árbol o para regalar. Podés escribirle un nombre en el pecho. Se imprime a varios colores: la galleta, el glaseado, los botones y el moño.',
    tip: 'El marrón para la galleta y el blanco para el glaseado son la combinación clásica. Si no tenés cambio de filamento automático, pintá los detalles con marcadores de pintura acrílica una vez impreso.',
  },
  'baston-caramelo': {
    uso: 'Un bastón de caramelo con rayas y un gancho para colgar en el árbol, al que podés sumarle acebo con bayas. Las rayas son rojas, verdes o del color que quieras, e incluso podés cambiar su inclinación.',
    tip: 'Para que las rayas se vean nítidas, programá el cambio de color en cada franja. Si tu impresora no cambia de color sola, imprimí el bastón en un solo color liso o pintalo a mano con marcador acrílico.',
  },
  'arbol-zigzag': {
    uso: 'Un pino de niveles facetados con aristas en zigzag, base y estrella dorada. Elegís el alto, la cantidad de niveles y la profundidad del zigzag. Lo podés hacer en verde, rojo o dorado, y con varios tamaños armás una familia de arbolitos.',
    tip: 'Imprimí el árbol, la base y la estrella por separado en distintos colores y ensamblalos al final. Los niveles con más escalón entre sí lucen más marcados, pero tardan un poco más en imprimirse.',
  },
};

const PRINT_BY_CATEGORY = {
  accesorios: 'Es una pieza chica: en PLA se imprime en poco tiempo y con una capa de 0,2 mm queda con buen detalle en el texto.',
  negocios: 'Es una pieza de uso comercial: elegí PLA o PETG de buena calidad, y mejor PETG si va a estar cerca de una ventana con sol o de un local caluroso.',
  tecnologia: 'Es una pieza de escritorio que carga peso: usá PLA o PETG con un relleno del 15 al 20 % y al menos 3 perímetros.',
  organizacion: 'Es una pieza de uso diario: PLA alcanza para interiores y un relleno bajo, del 10 al 15 %, ahorra material.',
  hogar: 'Es una pieza decorativa y funcional: PLA para interiores; PETG si va a estar en contacto con humedad o con calor.',
  navidad: 'Es una pieza decorativa: PLA con colores brillantes o con brillo (silk) queda muy bien en el árbol. Es liviana, así que alcanza con un relleno bajo.',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Lista de lo que se puede ajustar, sacada de las opciones reales del diseño. */
function ajustables(def) {
  const labels = [];
  for (const s of def.sections || []) for (const it of s.items || []) {
    if (typeof it.label === 'string' && it.type !== 'color' && it.type !== 'filament' && !labels.includes(it.label)) labels.push(it.label);
  }
  return labels.slice(0, 14);
}

export function objectInfoHtml(def) {
  const info = INFO[def.id];
  if (!info) return '';
  const aj = ajustables(def);
  const pc = PRINT_BY_CATEGORY[def.category] || '';
  return `
    <section class="editor-guide object-info" aria-label="Sobre este diseño">
      <div><span class="eyebrow">Sobre este diseño</span><h2>Para qué sirve ${esc(def.name.charAt(0).toLowerCase() + def.name.slice(1))}</h2></div>
      <div class="editor-guide-body">
        <p>${esc(info.uso)}</p>
        ${aj.length ? `<h3>Qué podés ajustar</h3><p>En el editor de arriba cambiás en vivo: ${aj.map((l) => esc(l.toLowerCase())).join(', ')}. La vista 3D se actualiza al instante y te avisa si algo no se puede imprimir bien.</p>` : ''}
        <h3>Cómo imprimirlo</h3>
        <p>Tiempo estimado: ${esc(def.printTime)}. ${esc(pc)} ${esc(info.tip)}</p>
        <p>Cuando termines, descargás el modelo en 3MF, STL u OBJ y lo abrís en tu laminador, o nos lo pedís ya impreso desde el botón del editor.</p>
      </div>
    </section>`;
}
