export const mealTypes = ["Desayuno", "Comida", "Merienda", "Cena"] as const
export type MealType = (typeof mealTypes)[number]

export const defaultMeals: Readonly<Record<MealType, string>> = {
  Desayuno: "Huevos + tostada integral + fruta",
  Comida: "Pollo asado + verduras + garbanzos",
  Merienda: "Fruta + yogur",
  Cena: "Crema de verduras + tortilla + ensalada",
}

export const mealOptions: Readonly<Record<MealType, readonly string[]>> = {
  Desayuno: [
    "Huevos + tostada integral + fruta",
    "Avena con nueces y fruta",
    "Yogur natural con granola",
    "Tortilla de espinacas + tostada integral",
    "Tostada de aguacate y huevo",
  ],
  Comida: [
    "Pollo asado + verduras + garbanzos",
    "Salmón + quinoa + brócoli",
    "Lentejas estofadas con verduras",
    "Pavo + arroz integral + ensalada",
    "Pescado blanco + patata + verduras",
  ],
  Merienda: [
    "Fruta + yogur",
    "Frutos secos + fruta",
    "Yogur con semillas",
    "Manzana + crema de cacahuete",
    "Huevo cocido + fruta",
  ],
  Cena: [
    "Crema de verduras + tortilla + ensalada",
    "Salmón + brócoli + garbanzos",
    "Pescado al horno + verduras",
    "Ensalada completa con legumbres",
    "Revuelto de verduras + tostada integral",
  ],
}
