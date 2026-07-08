# Miga Azul — Tienda de galletas 🍪

Landing page de una tienda de galletas artesanales, portada desde un diseño de **Claude Design** a una app **Next.js (App Router + TypeScript)** lista para desplegar en **Vercel**.

## Características

- Hero, catálogo de 6 productos, newsletter y footer.
- Carrito lateral (drawer) con control de cantidades y cálculo de envío gratis.
- Checkout en 3 pasos: datos → pago **simulado** → confirmación.
- 100% responsive (desktop, tablet, móvil).
- Accesible: roles ARIA en los diálogos, cierre con `Escape`, foco visible y soporte de `prefers-reduced-motion`.
- Fuente **Outfit** auto-hospedada vía `next/font` (sin CLS ni peticiones a terceros).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
```

## Producción local

```bash
npm run build
npm start
```

## Desplegar en Vercel

**Opción A — desde el panel de Vercel**

1. Sube este proyecto a un repositorio de GitHub / GitLab / Bitbucket.
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repositorio.
3. Vercel detecta Next.js automáticamente (build `next build`, sin configuración extra). Pulsa **Deploy**.

**Opción B — desde la terminal**

```bash
npm i -g vercel
vercel           # despliegue de previsualización
vercel --prod    # producción
```

## Personalización

Edita [`app/config.ts`](app/config.ts):

| Constante | Qué controla |
|-----------|--------------|
| `ACCENT` | Color de acento de la marca. |
| `SHOW_BANNER` | Muestra u oculta la barra superior. |
| `FREE_SHIPPING_THRESHOLD` | Monto (COP) para envío gratis. |
| `SHIPPING_COST` | Costo de envío bajo el umbral (COP). |
| `PRODUCTS` | Catálogo: nombre, descripción, precio, etiqueta y gradiente. |

### Imágenes

Los productos usan placeholders (gradiente + emoji). Para usar fotos reales, coloca las imágenes en `public/`
y reemplaza `<CookiePlaceholder>` por el componente `<Image>` de `next/image` en [`app/page.tsx`](app/page.tsx).

> ⚠️ El pago es **simulado**: no procesa cobros reales. Para cobros reales integra una pasarela
> (Wompi, Mercado Pago, Stripe, etc.).
