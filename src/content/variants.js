// Variantes de un mismo diseño que se muestran como carrusel en la tarjeta del catálogo.
// La primera es la foto principal (/miniaturas/<id>.webp); las demás están en
// /miniaturas/variantes/<id>--<clave>.webp. Al tocar la tarjeta, el editor abre con esos ajustes.
export const VARIANTS = {
  'lampara-led': [
    { key: 'ondas', label: 'Ondas apiladas', params: {} },
    { key: 'hongo', label: 'Hongo', params: { style: 'hongo', colorBase: '#7E8C72', colorShade: '#F3EEE2' } },
    { key: 'texturada', label: 'Texturada', params: { style: 'texturada', colorBase: '#26272B' } },
    { key: 'espiral', label: 'Globo espiral', params: { style: 'espiral', colorBase: '#B98A5B' } },
    { key: 'acanalada', label: 'Acanalada', params: { style: 'acanalada', colorBase: '#E87BA8' } },
    { key: 'ondulada', label: 'Ondulada', params: { style: 'ondulada', colorBase: '#2563C9' } },
  ],
  'soporte-celular': [
    { key: 'liso', label: 'Liso', params: {} },
    { key: 'ranuras', label: 'Ranuras', params: { design: 'ranuras', color: '#26272B' } },
    { key: 'manzana', label: 'Manzana', params: { design: 'manzana', color: '#B08A4A' } },
    { key: 'robot', label: 'Robot', params: { design: 'robot', color: '#2E9E58' } },
    { key: 'ondas', label: 'Ondas', params: { design: 'ondas', color: '#8FD3B6' } },
    { key: 'texto', label: 'Con nombre', params: { design: 'texto', text: 'Martina', color: '#E87BA8' } },
  ],
  llavero: [
    { key: 'contorno', label: 'Contorno', params: {} },
    { key: 'barra', label: 'Barra', params: { variant: 'bar', text: 'JAXSON', font: 'archivo', colorBase: '#E8742A', colorText: '#E8742A' } },
    { key: 'capsula', label: 'Cápsula', params: { variant: 'capsule', text: 'Lucas', symbol: 'star', colorBase: '#26272B', colorText: '#F2C230' } },
    { key: 'placa', label: 'Placa con borde', params: { variant: 'rect', text: 'Mía', symbol: 'paw', rim: 1.2, colorBase: '#8FD3B6', colorText: '#F1F1EC' } },
  ],
};

/** Dirección del editor con los ajustes de una variante. */
export function variantHref(id, v) {
  const q = new URLSearchParams();
  for (const [k, val] of Object.entries(v.params || {})) q.set(k, typeof val === 'boolean' ? (val ? '1' : '0') : String(val));
  const s = q.toString();
  return `/crear/${id}${s ? `?${s}` : ''}`;
}
