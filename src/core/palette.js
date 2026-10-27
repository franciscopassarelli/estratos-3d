// Colores de filamento habituales (valores aproximados, solo de referencia visual).
export const FILAMENTS = [
  { name: 'Blanco', hex: '#F1F1EC' },
  { name: 'Negro', hex: '#26272B' },
  { name: 'Gris', hex: '#8B9098' },
  { name: 'Plata', hex: '#BCC1C8' },
  { name: 'Rojo', hex: '#C9302C' },
  { name: 'Naranja', hex: '#E8742A' },
  { name: 'Amarillo', hex: '#F2C230' },
  { name: 'Verde', hex: '#2E9E58' },
  { name: 'Verde menta', hex: '#8FD3B6' },
  { name: 'Azul', hex: '#2563C9' },
  { name: 'Celeste', hex: '#5BB8E8' },
  { name: 'Violeta', hex: '#7A4FC0' },
  { name: 'Rosa', hex: '#E87BA8' },
  { name: 'Madera', hex: '#B98A5B' },
  { name: 'Dorado seda', hex: '#C9A24A' },
  { name: 'Terracota', hex: '#B5563A' },
];

export const PRINT = {
  nozzle: 0.4,
  minWall: 1.2, // 3 perímetros de 0,4 mm
  minFeature: 0.8, // 2 líneas de extrusión
  bed: { x: 220, y: 220, z: 250 },
  plaDensity: 1.24, // g/cm³
  filamentDiameter: 1.75,
};
