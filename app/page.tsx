"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
import {
  ACCENT,
  SHOW_BANNER,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
  PRODUCTS,
  formatCOP,
} from "./config";

const ACCENT_DARK = "color-mix(in oklch, var(--accent), black 30%)";

/** Ícono de imagen del image-slot (idéntico al de Claude Design). */
function SlotIcon({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.45, ...style }}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

/**
 * Placeholder de imagen rellenable, réplica del <image-slot> de Claude Design:
 * marco con borde punteado, ícono, leyenda "Foto: …" y "or browse files".
 * Al hacer clic abre el selector de archivos y muestra la imagen elegida.
 */
function ImageSlot({
  radius,
  label,
  interactive = true,
}: {
  radius: number;
  label: string;
  interactive?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };
  useEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);

  return (
    <div
      className="image-slot"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        background: "rgba(0,0,0,0.04)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : interactive ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={`${label} — subir imagen`}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            textAlign: "center",
            padding: 12,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            font: "13px/1.3 system-ui, -apple-system, sans-serif",
            color: "rgba(0,0,0,0.55)",
          }}
        >
          <SlotIcon size={28} />
          <span style={{ maxWidth: "90%", fontWeight: 500, letterSpacing: "0.01em" }}>{label}</span>
          <span style={{ fontSize: 11 }}>
            or <u>browse files</u>
          </span>
        </button>
      ) : (
        <div
          role="img"
          aria-label={label}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            textAlign: "center",
            padding: 12,
            font: "13px/1.3 system-ui, -apple-system, sans-serif",
            color: "rgba(0,0,0,0.55)",
          }}
        >
          <SlotIcon size={28} />
          <span style={{ maxWidth: "90%", fontWeight: 500, letterSpacing: "0.01em" }}>{label}</span>
        </div>
      )}
      {!src && (
        <span
          className="image-slot-ring"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            border: "1.5px dashed rgba(0,0,0,0.25)",
            pointerEvents: "none",
            transition: "border-color 0.12s ease",
          }}
        />
      )}
      {interactive && (
        <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
      )}
    </div>
  );
}

/** Miniatura de imagen (image-slot en pequeño, solo ícono) para el carrito. */
function ImageThumb({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        position: "relative",
        flex: "none",
        background: "rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(0,0,0,0.55)",
      }}
    >
      <SlotIcon size={20} />
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12,
          border: "1.5px dashed rgba(0,0,0,0.25)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function Page() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [drawer, setDrawer] = useState(false);
  const [step, setStep] = useState(0); // 0 cerrado · 1 datos · 2 pago · 3 confirmado
  const [form, setForm] = useState({ nombre: "", correo: "", direccion: "", ciudad: "" });
  const [card, setCard] = useState({ num: "", exp: "", cvc: "" });
  const [step1Error, setStep1Error] = useState(false);
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState<{ num: string; total: string; name: string } | null>(null);
  const [newsVal, setNewsVal] = useState("");
  const [newsDone, setNewsDone] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const overlayRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  /* ─────────── carrito ─────────── */
  const incQty = (id: string) => setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const decQty = (id: string) =>
    setCart((p) => {
      const q = (p[id] || 0) - 1;
      const next = { ...p };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  const addToCart = (id: string) => {
    incQty(id);
    setDrawer(true);
  };

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = PRODUCTS.reduce((a, p) => a + p.price * (cart[p.id] || 0), 0);
  const freeShip = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = cartCount === 0 || freeShip ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const hasCart = cartCount > 0;
  const cartItems = PRODUCTS.filter((p) => cart[p.id]);
  const detail = detailId ? PRODUCTS.find((p) => p.id === detailId) ?? null : null;
  const dialogOpen = drawer || step > 0 || detailId !== null;

  /* ─────────── checkout ─────────── */
  const startCheckout = () => {
    setDrawer(false);
    setStep(1);
    setStep1Error(false);
  };
  const closeCheckout = () => {
    if (step === 3) {
      setStep(0);
      setCart({});
      setCard({ num: "", exp: "", cvc: "" });
    } else {
      setStep(0);
    }
  };
  const toStep2 = () => {
    if (form.nombre.trim() && form.direccion.trim()) {
      setStep(2);
      setStep1Error(false);
    } else {
      setStep1Error(true);
    }
  };
  const pay = () => {
    if (paying) return;
    setPaying(true);
    const num = "MA-" + Math.floor(1000 + Math.random() * 9000);
    const paidTotal = formatCOP(total);
    const name = form.nombre.trim().split(" ")[0];
    setTimeout(() => {
      setPaying(false);
      setStep(3);
      setOrder({ num, total: paidTotal, name });
    }, 1100);
  };

  const submitNews = () => {
    if (newsVal.trim()) setNewsDone(true);
  };

  /* ─────────── overlays: bloquear scroll + cerrar con Escape ─────────── */
  useEffect(() => {
    document.body.style.overflow = dialogOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (detailId) setDetailId(null);
      else if (step > 0) closeCheckout();
      else if (drawer) setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer, step, detailId]);

  /* ─────────── overlays: guardar y restaurar el foco del disparador ─────────── */
  useEffect(() => {
    if (dialogOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else if (triggerRef.current) {
      triggerRef.current.focus?.();
      triggerRef.current = null;
    }
  }, [dialogOpen]);

  /* ─────────── overlays: mover el foco al diálogo + atrapar Tab ─────────── */
  useEffect(() => {
    const node = overlayRef.current;
    if (!node) return;
    const getFocusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
    (getFocusable()[0] ?? node).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = getFocusable();
      if (f.length === 0) {
        e.preventDefault();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [drawer, step, detailId]);

  const rootStyle = { "--accent": ACCENT } as unknown as CSSProperties;

  return (
    <div style={rootStyle}>
      <div inert={dialogOpen || undefined}>
      {/* ═══════════ BANNER ═══════════ */}
      {SHOW_BANNER && (
        <div
          style={{
            background: "color-mix(in oklch, var(--accent), white 40%)",
            color: "#3D5A7C",
            textAlign: "center",
            padding: "9px 16px",
            fontSize: 13.5,
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Envío gratis en pedidos desde {formatCOP(FREE_SHIPPING_THRESHOLD)} 🍪 · Horneado fresco cada
          mañana
        </div>
      )}

      {/* ═══════════ HEADER ═══════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(247,250,253,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid color-mix(in oklch, var(--accent), white 55%)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <a href="#inicio" style={{ display: "flex", alignItems: "center", gap: 10, color: "#2B3644" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="Cookies Crunch"
              width={38}
              height={38}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Cookies Crunch</span>
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 26, fontSize: 14.5, fontWeight: 500 }}>
            <a href="#productos" className="nav-link">
              Productos
            </a>
            <a href="#newsletter" className="nav-link">
              Contacto
            </a>
            <button
              onClick={() => setDrawer(true)}
              className="btn-primary"
              aria-label="Abrir carrito"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", fontSize: 14 }}
            >
              Carrito
              {hasCart && (
                <span
                  style={{
                    background: "#FFFFFF",
                    color: "#3D5A7C",
                    borderRadius: 999,
                    minWidth: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "0 5px",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section
        id="inicio"
        className="hero-section"
        style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 64px" }}
      >
        <div className="hero-grid" style={{ display: "grid", gap: 56, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <span
              style={{
                alignSelf: "flex-start",
                background: "color-mix(in oklch, var(--accent), white 50%)",
                color: "#3D5A7C",
                borderRadius: 999,
                padding: "7px 15px",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              HORNEADAS EN CASA
            </span>
            <h1
              className="hero-title"
              style={{
                margin: 0,
                fontSize: 56,
                lineHeight: 1.06,
                fontWeight: 700,
                letterSpacing: "-0.025em",
              }}
            >
              Galletas suaves, momentos dulces
            </h1>
            <p
              className="pretty"
              style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: "#5A6B80", maxWidth: "46ch" }}
            >
              Recetas artesanales con ingredientes de verdad. Pide hoy y recibe tus galletas recién
              horneadas en la puerta de tu casa.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
              <a
                href="#productos"
                className="btn-primary"
                style={{ padding: "15px 30px", fontSize: 15.5, display: "inline-block" }}
              >
                Ver galletas
              </a>
              <a
                href="#newsletter"
                className="btn-secondary"
                style={{ padding: "15px 30px", fontSize: 15.5, display: "inline-block" }}
              >
                Escríbenos
              </a>
            </div>
            <div
              style={{
                display: "flex",
                gap: 30,
                marginTop: 14,
                fontSize: 13.5,
                color: "#5F7085",
                flexWrap: "wrap",
              }}
            >
              <span>★ 4,9 de valoración</span>
              <span>+2.400 pedidos entregados</span>
            </div>
          </div>
          <div className="hero-media" style={{ position: "relative", height: 440 }}>
            <div
              style={{
                position: "absolute",
                inset: "24px -12px -12px 24px",
                background: "color-mix(in oklch, var(--accent), white 55%)",
                borderRadius: 32,
              }}
            />
            <div style={{ position: "absolute", inset: "0 12px 12px 0" }}>
              <ImageSlot radius={28} label="Foto principal de galletas" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRODUCTOS ═══════════ */}
      <section
        id="productos"
        style={{ background: "#FFFFFF", borderTop: "1px solid #EDF2F8", borderBottom: "1px solid #EDF2F8" }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "72px 28px 84px",
            display: "flex",
            flexDirection: "column",
            gap: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Nuestras galletas
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: "#5A6B80" }}>
                Horneadas por tandas pequeñas, todos los días.
              </p>
            </div>
            <span style={{ fontSize: 14, color: "#5F7085", whiteSpace: "nowrap" }}>
              {PRODUCTS.length} sabores disponibles
            </span>
          </div>
          <div className="products-grid" style={{ display: "grid", gap: 26 }}>
            {PRODUCTS.map((p) => (
              <div
                key={p.id}
                className="product-card"
                role="button"
                tabIndex={0}
                onClick={() => setDetailId(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDetailId(p.id);
                  }
                }}
                aria-label={`Ver ${p.name}`}
                style={{
                  background: "#F9FBFE",
                  border: "1px solid #EBF1F8",
                  borderRadius: 22,
                  padding: "14px 14px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  cursor: "pointer",
                }}
              >
                <div className="product-media" style={{ position: "relative", height: 200 }}>
                  <ImageSlot radius={14} label={`Foto: ${p.name}`} interactive={false} />
                  {p.tag && (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: ACCENT_DARK,
                        color: "#FFFFFF",
                        borderRadius: 999,
                        padding: "5px 11px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        pointerEvents: "none",
                      }}
                    >
                      {p.tag}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 6px" }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{p.name}</h3>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "#5F7085" }}>{p.desc}</p>
                </div>
                <div
                  className="product-foot"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 6px",
                    marginTop: "auto",
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#3D5A7C" }}>
                    {formatCOP(p.price)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p.id);
                    }}
                    className="btn-soft product-add"
                    aria-label={`Agregar ${p.name} al carrito`}
                    style={{ padding: "10px 18px", fontSize: 13.5 }}
                  >
                    Agregar +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ NEWSLETTER / CONTACTO ═══════════ */}
      <section id="newsletter" style={{ maxWidth: 1120, margin: "0 auto", padding: "84px 28px" }}>
        <div
          style={{
            background: "color-mix(in oklch, var(--accent), white 55%)",
            borderRadius: 32,
            padding: "60px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            textAlign: "center",
          }}
        >
          <h2
            style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", color: "#2B3644" }}
          >
            Recibe sabores nuevos primero
          </h2>
          <p className="pretty" style={{ margin: 0, fontSize: 16, color: "#4A5B70", maxWidth: "52ch" }}>
            Suscríbete y entérate de lanzamientos, descuentos y sabores de temporada. Sin spam, solo
            galletas.
          </p>
          {!newsDone ? (
            <div style={{ display: "flex", gap: 10, marginTop: 8, width: "100%", maxWidth: 460 }}>
              <input
                value={newsVal}
                onChange={(e) => setNewsVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNews();
                }}
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                aria-label="Correo electrónico"
                className="field-news"
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                onClick={submitNews}
                className="btn-primary"
                style={{ padding: "14px 26px", fontSize: 15 }}
              >
                Suscribirme
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 999,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 600,
                color: "#3D5A7C",
                marginTop: 8,
              }}
            >
              ¡Listo! Te escribiremos pronto 💌
            </div>
          )}
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#4A5B70" }}>
            ¿Pedidos especiales? Escríbenos a{" "}
            <a href="mailto:hola@migaazul.co" style={{ fontWeight: 600 }}>
              hola@migaazul.co
            </a>{" "}
            o al WhatsApp 300 123 4567
          </p>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ borderTop: "1px solid #EDF2F8", background: "#FFFFFF" }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            fontSize: 13.5,
            color: "#5F7085",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 600, color: "#2B3644" }}>Miga Azul</span>
          <span>Jamundí, Valle del Cauca · Todos los precios en COP</span>
          <span>© 2026 Miga Azul</span>
        </div>
      </footer>

      </div>

      {/* ═══════════ CARRITO (drawer) ═══════════ */}
      {drawer && (
        <div role="dialog" aria-modal="true" aria-label="Tu carrito" style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div
            onClick={() => setDrawer(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(43,54,68,0.35)",
              animation: "fadeIn 0.25s ease",
            }}
          />
          <aside
            ref={overlayRef}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 400,
              maxWidth: "92vw",
              background: "#FFFFFF",
              boxShadow: "-12px 0 40px rgba(43,54,68,0.18)",
              display: "flex",
              flexDirection: "column",
              animation: "slideIn 0.3s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "22px 24px",
                borderBottom: "1px solid #EDF2F8",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Tu carrito</h3>
              <button onClick={() => setDrawer(false)} className="icon-btn" aria-label="Cerrar carrito">
                ✕
              </button>
            </div>

            {!hasCart ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  color: "#5F7085",
                  padding: 24,
                }}
              >
                <span style={{ fontSize: 40 }}>🍪</span>
                <p style={{ margin: 0, fontSize: 15 }}>Tu carrito está vacío</p>
                <button
                  onClick={() => setDrawer(false)}
                  className="btn-soft"
                  style={{ padding: "11px 22px", fontSize: 14 }}
                >
                  Ver galletas
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "18px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {cartItems.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        background: "#F9FBFE",
                        border: "1px solid #EBF1F8",
                        borderRadius: 16,
                        padding: "12px 14px",
                      }}
                    >
                      <ImageThumb label={`Foto: ${p.name}`} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</span>
                        <span style={{ fontSize: 13, color: "#5F7085" }}>{formatCOP(p.price)} c/u</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => decQty(p.id)}
                          className="qty-btn"
                          aria-label={`Quitar una ${p.name}`}
                        >
                          −
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 600, minWidth: 16, textAlign: "center" }}>
                          {cart[p.id]}
                        </span>
                        <button
                          onClick={() => incQty(p.id)}
                          className="qty-btn"
                          aria-label={`Agregar una ${p.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    borderTop: "1px solid #EDF2F8",
                    padding: "20px 24px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {!freeShip && (
                    <div
                      style={{
                        background: "color-mix(in oklch, var(--accent), white 60%)",
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "#3D5A7C",
                      }}
                    >
                      Te faltan <b>{formatCOP(Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal))}</b> para
                      envío gratis
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#5A6B80" }}>
                    <span>Subtotal</span>
                    <span>{formatCOP(subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#5A6B80" }}>
                    <span>Envío</span>
                    <span>{freeShip ? "Gratis 🎉" : formatCOP(shipping)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#2B3644",
                    }}
                  >
                    <span>Total</span>
                    <span>{formatCOP(total)}</span>
                  </div>
                  <button
                    onClick={startCheckout}
                    className="btn-primary"
                    style={{ padding: 15, fontSize: 15.5, marginTop: 4 }}
                  >
                    Finalizar compra
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* ═══════════ CHECKOUT (modal) ═══════════ */}
      {step > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Finalizar compra"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={closeCheckout}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(43,54,68,0.45)",
              animation: "fadeIn 0.25s ease",
            }}
          />
          <div
            ref={(el) => {
              overlayRef.current = el;
            }}
            style={{
              position: "relative",
              background: "#FFFFFF",
              borderRadius: 26,
              width: 460,
              maxWidth: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              animation: "popIn 0.3s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {step < 3 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>
                    {step === 1 ? "Datos de entrega" : "Pago"}
                  </h3>
                  <button onClick={closeCheckout} className="icon-btn" aria-label="Cerrar">
                    ✕
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      background: "color-mix(in oklch, var(--accent), black 25%)",
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      background: step >= 2 ? "color-mix(in oklch, var(--accent), black 25%)" : "#E5EDF6",
                    }}
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  aria-label="Nombre completo"
                  autoComplete="name"
                  className="field"
                />
                <input
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  type="email"
                  placeholder="Correo electrónico"
                  aria-label="Correo electrónico"
                  autoComplete="email"
                  className="field"
                />
                <input
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Dirección de entrega"
                  aria-label="Dirección de entrega"
                  autoComplete="street-address"
                  className="field"
                />
                <input
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  placeholder="Ciudad"
                  aria-label="Ciudad"
                  autoComplete="address-level2"
                  className="field"
                />
                {step1Error && (
                  <span style={{ fontSize: 13, color: "#C36674" }}>
                    Completa nombre y dirección para continuar
                  </span>
                )}
                <button
                  onClick={toStep2}
                  className="btn-primary"
                  style={{ padding: 15, fontSize: 15.5, marginTop: 4 }}
                >
                  Continuar al pago
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{
                    background: "#F9FBFE",
                    border: "1px solid #EBF1F8",
                    borderRadius: 16,
                    padding: "14px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 13.5,
                    color: "#5A6B80",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      {cartCount} {cartCount === 1 ? "galleta" : "galletas"}
                    </span>
                    <span>{formatCOP(subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Envío</span>
                    <span>{freeShip ? "Gratis 🎉" : formatCOP(shipping)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#2B3644",
                    }}
                  >
                    <span>Total a pagar</span>
                    <span>{formatCOP(total)}</span>
                  </div>
                </div>
                <input
                  value={card.num}
                  onChange={(e) => setCard({ ...card, num: e.target.value })}
                  placeholder="Número de tarjeta (simulado)"
                  aria-label="Número de tarjeta"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className="field"
                />
                <div style={{ display: "flex", gap: 12 }}>
                  <input
                    value={card.exp}
                    onChange={(e) => setCard({ ...card, exp: e.target.value })}
                    placeholder="MM/AA"
                    aria-label="Vencimiento"
                    autoComplete="cc-exp"
                    className="field"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <input
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                    placeholder="CVC"
                    aria-label="CVC"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className="field"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                </div>
                <button
                  onClick={pay}
                  disabled={paying}
                  className="btn-primary"
                  style={{ padding: 15, fontSize: 15.5, marginTop: 4 }}
                >
                  {paying ? "Procesando…" : "Pagar " + formatCOP(total)}
                </button>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#5F7085",
                    fontFamily: "inherit",
                    fontSize: 13.5,
                    cursor: "pointer",
                  }}
                >
                  ← Volver a mis datos
                </button>
              </div>
            )}

            {step === 3 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "center",
                  padding: "12px 0",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "color-mix(in oklch, var(--accent), white 50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 34,
                    color: "#3D5A7C",
                  }}
                >
                  ✓
                </div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>¡Pedido confirmado!</h3>
                <p style={{ margin: 0, fontSize: 15, color: "#5A6B80", lineHeight: 1.55 }}>
                  Gracias, {order?.name}. Tu pedido <b>{order?.num}</b> por <b>{order?.total}</b> llegará
                  en 24–48 horas.
                </p>
                <button
                  onClick={closeCheckout}
                  className="btn-primary"
                  style={{ padding: "14px 32px", fontSize: 15, marginTop: 6 }}
                >
                  Seguir explorando
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ DETALLE DE PRODUCTO (modal) ═══════════ */}
      {detail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={detail.name}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 65,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={() => setDetailId(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(43,54,68,0.45)",
              animation: "fadeIn 0.25s ease",
            }}
          />
          <div
            ref={(el) => {
              overlayRef.current = el;
            }}
            style={{
              position: "relative",
              background: "#FFFFFF",
              borderRadius: 26,
              width: 480,
              maxWidth: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              animation: "popIn 0.3s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setDetailId(null)} className="icon-btn" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div style={{ position: "relative", height: 260 }}>
              <ImageSlot key={detail.id} radius={18} label={`Foto: ${detail.name}`} />
              {detail.tag && (
                <span
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: ACCENT_DARK,
                    color: "#FFFFFF",
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    pointerEvents: "none",
                  }}
                >
                  {detail.tag}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em" }}>
                {detail.name}
              </h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#5A6B80" }}>{detail.desc}</p>
            </div>
            <div
              className="product-foot"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 700, color: "#3D5A7C" }}>
                {formatCOP(detail.price)}
              </span>
              <button
                onClick={() => {
                  addToCart(detail.id);
                  setDetailId(null);
                }}
                className="btn-primary"
                style={{ padding: "14px 26px", fontSize: 15.5 }}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
