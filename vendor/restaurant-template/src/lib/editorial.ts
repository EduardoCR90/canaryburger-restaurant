import type { Content } from "../types/content";
export const originalDefaults = {
  composition: {
    hero: {
      caption: "Una mesa para compartir",
      coordinates: "COCINA · MESA",
      sideNote: "COMPARTIR · DISFRUTAR",
      link: { label: "Ver carta", href: "/carta/" },
    },
    essence: {
      eyebrow: "Nuestra cocina",
      heading: { before: "El sabor de ", emphasis: "lo cercano.", after: "" },
      link: { label: "Conócenos", href: "/restaurante/" },
    },
    featured: {
      eyebrow: "Nuestra selección",
      heading: { before: "Platos para ", emphasis: "disfrutar.", after: "" },
      link: { label: "Ver toda la carta", href: "/carta/" },
      empty: "La selección estará disponible próximamente.",
    },
    storyPreview: {
      eyebrow: "El restaurante",
      link: { label: "Nuestra historia", href: "/restaurante/" },
    },
    story: { eyebrow: "Nuestra historia" },
    chef: { eyebrow: "Nuestro equipo" },
    gallery: {
      eyebrow: "El espacio",
      heading: {
        before: "Una mirada ",
        emphasis: "al restaurante.",
        after: "",
      },
      empty: "Próximamente, nuevas imágenes.",
    },
    contact: {
      eyebrow: "Contacto",
      heading: { before: "Te esperamos ", emphasis: "aquí.", after: "" },
      providerLabel: "Abrir proveedor de reservas",
      hoursTitle: "Horarios",
      addressTitle: "Ubicación",
      unavailable:
        "Las reservas no están activas. No se tramita ni confirma ninguna reserva desde esta web.",
    },
  },
  editorial: {
    signature: "RESTAURANTE",
    footer: {
      line: "Una mesa para compartir.",
      link: { label: "Contacto", href: "/reservas/" },
      backToTop: "Volver arriba",
    },
    reservation: {
      eyebrow: "Tu próxima visita",
      heading: { before: "Nos vemos ", emphasis: "pronto.", after: "" },
      link: { label: "Información y contacto", href: "/reservas/" },
    },
    menu: {
      emptyCategory: "Esta selección estará disponible próximamente.",
      emptyMenu: "La carta estará disponible próximamente.",
      disclaimer:
        "Precios en euros. Consulta los alérgenos y la disponibilidad con el equipo.",
      noAllergens: "Sin alérgenos declarados",
      unavailable: "Temporalmente no disponible",
    },
  },
} as const;
// Merge only missing/null values. Headings are atomic so a custom heading can omit emphasis.
type Widen<T> = T extends string
  ? string
  : T extends { label: string; href: string }
    ? { label: string; href: string } | null
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;
export function inherit<T>(base: T, value: unknown): Widen<T> {
  if (
    value === null &&
    typeof base === "object" &&
    base !== null &&
    "href" in base
  )
    return null as Widen<T>;
  if (value == null) return structuredClone(base) as Widen<T>;
  if (typeof base !== "object" || base === null || Array.isArray(base))
    return value as Widen<T>;
  if ("before" in base) {
    const h = value as Record<string, unknown>;
    return {
      before: h.before ?? "",
      emphasis: h.emphasis ?? "",
      after: h.after ?? "",
    } as Widen<T>;
  }
  return Object.fromEntries(
    Object.entries(base).map(([key, fallback]) => [
      key,
      inherit(fallback, (value as Record<string, unknown>)[key]),
    ]),
  ) as Widen<T>;
}
export function pageCopy(page: Content["pages"][number]) {
  return inherit(originalDefaults.composition, page.composition);
}
export function siteCopy(settings: Content["settings"]) {
  return inherit(originalDefaults.editorial, settings.editorial);
}

export function visibleEditorialLink(
  content: Content,
  link: { href: string; label: string } | null,
) {
  if (!link) return false;
  if (!link.href.startsWith("/")) return true;
  const route = link.href.split(/[?#]/)[0].replace(/^\/|\/$/g, "");
  const slug = route || "inicio";
  return content.pages.some((p) => p.slug === slug && p.status === "published");
}

export function sectionEnabled(page:Content['pages'][number],section:import('../types/visual').SectionName){return page.composition?.sections?.[section]!==false;}
