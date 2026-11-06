// Una instantánea coherente: solo documentos publicados, resueltos en build.
export const restaurantQuery = `{
 "publicationRevisions": *[_type in ["settings","page","category","dish","story","gallery"]]{_id,_rev},
 "publishedDocumentCount": count(*[_type in ["settings", "page", "category", "dish", "story", "gallery"]]),
 "settings": *[_type == "settings" && _id == "restaurant-settings"][0]{name,tagline,concept,address,email,phone,isFictional,reservationUrl,editorial,socialImage{"url":asset->url,alt},logo{"url":asset->url,alt},"theme":coalesce(theme,{}),"modules":coalesce(modules,[]),hours[]{days,time}},
 "pages": *[_type == "page"] | order(select(slug.current == "inicio" => 0, slug.current == "carta" => 1, slug.current == "restaurante" => 2, slug.current == "reservas" => 3, 4) asc, slug.current asc){"slug":slug.current,"status":coalesce(status,"published"),"noindex":coalesce(noindex,false),"showInNavigation":coalesce(showInNavigation,true),"navigationOrder":coalesce(navigationOrder,select(slug.current == "inicio" => 0,slug.current == "carta" => 1,slug.current == "restaurante" => 2,slug.current == "reservas" => 3,4)),navigationLabel,composition,
  "blocks":coalesce(blocks[]{...,"image":image{"url":asset->url,alt},"images":images[]{"url":asset->url,alt},"categoryIds":coalesce(categories[]._ref,[]),"dishIds":coalesce(dishes[]._ref,[]),items[]{...,"image":image{"url":asset->url,alt}}},[]),
  "eyebrow":coalesce(eyebrow,""),title,"intro":coalesce(intro,""),"image":image{"url":asset->url,alt},seo{title,description,"image":image{"url":asset->url,alt}}},
 "categories": *[_type == "category"] | order(order asc, name asc){_id,name,note,"visible":coalesce(visible,true),"order":coalesce(order,0)},
 "dishes": *[_type == "dish"] | order(order asc, name asc){_id,name,description,price,"visible":coalesce(visible,true),"order":coalesce(order,0),"tags":coalesce(tags,[]),"categoryId":category._ref,allergens,available,featured,"image":image{"url":asset->url,alt}},
 "story": *[_type == "story" && _id == "restaurant-story"][0]{title,body,philosophy,chefName,chefBio,"image":image{"url":asset->url,alt}},
 "gallery": coalesce(*[_type == "gallery" && _id == "restaurant-gallery"][0].images[]{"url":asset->url,alt},[])
}`;
