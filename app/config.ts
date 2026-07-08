export type Product = {
  id: string;
  name: string;
  desc: string;
  price: number;
  tag: string | null;
};

/* ─────────── Ajustes de marca — edítalos para personalizar la tienda ─────────── */

/** Color de acento de la marca. */
export const ACCENT = "#A9C8EA";
/** Mostrar u ocultar la barra superior de envío gratis. */
export const SHOW_BANNER = true;
/** Envío gratis a partir de este monto (COP). */
export const FREE_SHIPPING_THRESHOLD = 60000;
/** Costo de envío cuando no se alcanza el umbral (COP). */
export const SHIPPING_COST = 6000;

/* ─────────── Catálogo ─────────── */

export const PRODUCTS: Product[] = [
  {
    id: "chispas",
    name: "Chispas de Chocolate",
    desc: "La clásica de siempre, con chips de chocolate 70% y centro suave.",
    price: 8500,
    tag: "Más vendida",
  },
  {
    id: "avena",
    name: "Avena y Arequipe",
    desc: "Avena tostada con corazón de arequipe cremoso.",
    price: 8900,
    tag: null,
  },
  {
    id: "redvelvet",
    name: "Red Velvet",
    desc: "Masa aterciopelada con trozos de chocolate blanco.",
    price: 9500,
    tag: "Nueva",
  },
  {
    id: "mantequilla",
    name: "Mantequilla Clásica",
    desc: "Sencilla, dorada y crujiente por fuera, tierna por dentro.",
    price: 6900,
    tag: null,
  },
  {
    id: "doblechoco",
    name: "Doble Chocolate",
    desc: "Para amantes del cacao: masa de chocolate con doble chip.",
    price: 9900,
    tag: null,
  },
  {
    id: "cocolimon",
    name: "Coco y Limón",
    desc: "Fresca y tropical, con coco rallado y ralladura de limón.",
    price: 8900,
    tag: null,
  },
];

/** Formatea un valor numérico como pesos colombianos. */
export const formatCOP = (n: number) => "$" + n.toLocaleString("es-CO");
