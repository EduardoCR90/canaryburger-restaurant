import { contentSchema } from "@restaurant-platform/astro-template/types/content";

export const demoContent = contentSchema.parse({
  settings: {
    name: "Restaurante en preparación",
    tagline: "Una nueva mesa está a punto de abrir",
    concept: "Contenido provisional mientras el equipo editorial prepara la publicación.",
    address: "Ubicación pendiente de publicación",
    email: "contacto@restaurant.example",
    phone: "+00 000 000 000",
    isFictional: true,
    hours: [{ days: "Horario pendiente", time: "Próximamente" }],
  },
  pages: [
    {
      slug: "inicio",
      title: "Una nueva experiencia gastronómica",
      intro: "La web está preparada y el contenido se gestiona desde el dashboard.",
      seo: {
        title: "Restaurante en preparación",
        description: "Web provisional del restaurante.",
      },
      blocks: [
        {
          _type: "hero",
          _key: "hero",
          title: "Una nueva mesa está a punto de abrir",
          subtitle: "Contenido provisional editable desde el dashboard.",
        },
        { _type: "menuSection", _key: "menu" },
        {
          _type: "cta",
          _key: "cta",
          title: "Información y contacto",
          cta: { label: "Contacto", href: "/reservas/" },
        },
      ],
    },
    {
      slug: "carta",
      title: "Carta",
      intro: "La selección gastronómica estará disponible próximamente.",
      seo: { title: "Carta", description: "Carta provisional del restaurante." },
      blocks: [{ _type: "menuSection", _key: "menu" }],
    },
    {
      slug: "restaurante",
      title: "El restaurante",
      intro: "El equipo está preparando la historia y la experiencia del restaurante.",
      seo: {
        title: "El restaurante",
        description: "Presentación provisional del restaurante.",
      },
    },
    {
      slug: "reservas",
      title: "Contacto",
      intro: "La información definitiva se publicará desde el dashboard.",
      seo: { title: "Contacto", description: "Contacto provisional del restaurante." },
    },
  ],
  categories: [{ _id: "selection", name: "Próximamente" }],
  dishes: [
    {
      _id: "dish-example",
      categoryId: "selection",
      name: "Carta en preparación",
      description: "El equipo está ultimando la propuesta gastronómica.",
      price: 0,
      available: false,
    },
  ],
  story: {
    title: "Nuestra historia",
    body: "Contenido pendiente de publicación.",
    philosophy: "Producto, cuidado y hospitalidad.",
    chefName: "Equipo de cocina",
    chefBio: "Presentación pendiente de publicación.",
  },
  gallery: [],
});
