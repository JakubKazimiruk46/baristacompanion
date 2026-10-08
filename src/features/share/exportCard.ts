import { CARD_HEIGHT, CARD_WIDTH } from './card';

// Właściwości, które klasy Tailwinda nadają rysunkowi. Obrazek SVG wczytany do <img> nie widzi
// arkuszy stylów strony, więc przepisujemy obliczone wartości wprost do elementów.
const STYLE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-opacity',
  'stroke-width',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-variant-numeric',
];

function inlineStyles(source: Element, target: Element): void {
  const computed = getComputedStyle(source);
  const style = (target as SVGElement).style;
  for (const prop of STYLE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (value) style.setProperty(prop, value);
  }
  target.removeAttribute('class');
  for (let i = 0; i < source.children.length; i++) inlineStyles(source.children[i]!, target.children[i]!);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Nie udało się wczytać karty.'));
    image.src = url;
  });
}

/** Zamienia kartę (SVG na stronie) na obrazek PNG 1080×1920. */
export async function cardToPng(svg: SVGSVGElement): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);
  clone.setAttribute('width', String(CARD_WIDTH));
  clone.setAttribute('height', String(CARD_HEIGHT));

  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Przeglądarka nie obsługuje kanwy.');
    context.drawImage(image, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Nie udało się zapisać PNG.'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
