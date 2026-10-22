# 🥗 TupperFit

Diario de comidas, macros y ejercicio para adelgazar comiendo bien — pensado para quien usa
**tuppers ya preparados** (p. ej. nococinomas) y completa con desayunos/snacks caseros.
Funciona en móvil y ordenador (PWA instalable), sin servidor ni cuentas: los datos se guardan en tu dispositivo.

## Funciones

- **Hoy:** anillo de calorías restantes, barras de proteínas/hidratos/grasas, comidas del día
  (desayuno, media mañana, almuerzo, merienda, cena), peso, pasos, calorías activas del reloj, agua y nota.
  Calcula el déficit/superávit estimado del día.
- **Alimentos:** biblioteca de tuppers, platos y productos con su información nutricional, favoritos ⭐,
  búsqueda y filtros, importación masiva (pegar `Nombre; kcal; P; C; G`) y ~45 alimentos básicos por 100 g.
  Avisa cuando las kcal no cuadran con las macros (4·P + 4·C + 9·G).
- **Calculadora:** al añadir un producto nuevo introduces la etiqueta (por 100 g o por ración) y la cantidad;
  calcula kcal y macros al instante.
- **Plan:** planificación semanal por días, duplicar días, copiar la semana anterior o lo realmente comido,
  registrar lo planificado con un toque y **pedido de tuppers** de la semana.
- **Semana:** balance con gráficos (kcal, proteína, reparto de macros, peso, pasos), comparación con la
  semana anterior, déficit y grasa estimada perdida, y consejos automáticos de qué corregir.
- **Ajustes:** perfil, metabolismo basal (Mifflin-St Jeor), gasto diario, calorías sugeridas según el ritmo
  de pérdida, macros en % con gramos y g/kg de proteína, copia de seguridad (exportar/importar).

## Despliegue

Mira [DESPLIEGUE.md](DESPLIEGUE.md) (guía paso a paso para no informáticos).

## Notas técnicas

HTML + CSS + JavaScript sin dependencias ni paso de compilación. `sw.js` da soporte sin conexión;
`manifest.webmanifest` permite instalarla. Los datos van en `localStorage` (clave `tupperfit.v1`).
Las estimaciones no sustituyen el consejo de un profesional sanitario.
