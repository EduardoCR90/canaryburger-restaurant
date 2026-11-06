import { contentSchema } from "../src/types/content";
export const demoContent = contentSchema.parse({
  settings: {
    name: "Restaurante de ejemplo",
    tagline: "Cocina para compartir",
    concept:
      "Una propuesta de demostración para visualizar la arquitectura compartida.",
    address: "Ubicación de demostración",
    email: "contacto@restaurant.example",
    phone: "+00 000 000 000",
    isFictional: true,
    hours: [{ days: "Horario de ejemplo", time: "13:00–22:00" }],
  },
  pages: [
    {
      slug: "inicio",
      title: "Una mesa para compartir",
      intro: "Contenido de ejemplo independiente del restaurante de origen.",
      seo: {
        title: "Restaurante de ejemplo",
        description: "Una demostración del template reutilizable.",
      },
      blocks: [
        {
          _type: "hero",
          _key: "hero",
          title: "Tu restaurante, tu identidad",
          subtitle: "Componentes compartidos. Contenido propio.",
        },
        {
          _type: "richText",
          _key: "text",
          title: "Nuestra propuesta",
          body: [
            {
              _type: "block",
              style: "normal",
              children: [
                {
                  _type: "span",
                  text: "Este texto se gestiona desde el CMS.",
                  marks: [],
                },
              ],
              markDefs: [],
            },
          ],
        },
        { _type: "menuSection", _key: "menu" },
        {
          _type: "cta",
          _key: "cta",
          title: "Información de contacto",
          cta: { label: "Contacto", href: "/reservas/" },
        },
      ],
    },
    {
      slug: "reservas",
      title: "Contacto",
      intro: "Información ficticia de demostración.",
      seo: {
        title: "Contacto · Ejemplo",
        description: "Horarios e información de demostración.",
      },
    },
  ],
  categories: [{ _id: "selection", name: "Nuestra selección" }],
  dishes: [
    {
      _id: "dish-example",
      categoryId: "selection",
      name: "Plato de ejemplo",
      description: "Ingredientes de temporada y preparación de la casa.",
      price: 18,
      available: true,
    },
  ],
  story: {
    title: "Nuestra historia",
    body: "Una historia de ejemplo para el restaurante.",
    philosophy: "Producto, cuidado y hospitalidad.",
    chefName: "Equipo de cocina",
    chefBio: "Presentación de demostración.",
  },
  gallery: [],
});
