# 📲 Pasar pasos y calorías activas de tu Amazfit a TupperFit (iPhone)

**Cómo funciona:** tu Amazfit GTS 4 envía los datos a la app **Zepp**, y Zepp los guarda en la app **Salud** del iPhone.
Un **Atajo** lee esos datos de Salud y los copia como texto; en TupperFit pulsas **Importar** y se rellenan los pasos
y las calorías activas del día.

> ¿Por qué no es 100% automático? En iPhone, una web instalada en la pantalla de inicio no comparte datos con Safari y
> no puede abrirse con datos desde un Atajo. Por eso el último paso (pulsar *Importar*) es manual. Con una app de tienda
> sería automático.

## Antes de empezar (comprueba una vez)
1. En **Zepp** → Perfil → *Añadir cuentas* (o Ajustes) → **Apple Health**: actívalo y concede permisos de **Pasos** y **Energía activa**.
2. Abre la app **Salud** → *Explorar* → *Actividad*. Mira que aparezcan tus **Pasos** y tu **Energía activa** de hoy.
   Si no aparecen, abre Zepp un momento para que sincronice el reloj.

## Crear el Atajo (una sola vez, ~5 minutos)
Los nombres de las acciones pueden variar un poco según tu versión de iOS. Si algo no coincide, busca el nombre parecido.

1. Abre la app **Atajos** → botón **＋** (arriba a la derecha). Ponle de nombre **Salud a TupperFit**.
2. **Añadir acción** → busca **"Buscar muestras de Salud"**:
   - *Tipo* = **Pasos**
   - Añade un filtro: *Fecha de inicio* **es hoy**.
3. Añade **"Calcular estadísticas"** → operación **Suma**.
4. Añade **"Redondear número"** (0 decimales).
5. Repite 2-4 pero con el tipo **Energía activa**.
6. Añade **"Texto"** y escribe: `TupperFit pasos ` y toca para insertar la **variable de los pasos redondeados**, luego ` activas ` y la **variable de la energía redondeada**.
   Debe quedar como: `TupperFit pasos 8234 activas 340`.
7. Añade **"Copiar en el portapapeles"** (con ese texto).
8. (Opcional) Añade **"Mostrar notificación"**: "Datos copiados. Abre TupperFit → Importar".
9. Pulsa el icono de ajustes del atajo → **Añadir a pantalla de inicio** para tenerlo a un toque.

La primera vez, iOS te pedirá permiso para leer **Pasos** y **Energía activa** de Salud: acepta.

## Cada día
1. Con el móvil **desbloqueado**, toca el atajo **Salud a TupperFit**.
2. Abre **TupperFit** → **Hoy** → baja a *Cuerpo y actividad* → **📥 Importar de Salud (Atajo)**.
   - Si iOS pregunta por pegar, acepta.
   - Si no encuentra nada, se abre un cuadro: mantén pulsado → **Pegar** → **Importar**.
3. Verás "Importado de Salud: 8234 pasos · 340 kcal activas ✔".

## Consejos y límites
- **Hazlo con el móvil desbloqueado.** Salud protege sus datos con el móvil bloqueado, y una automatización nocturna suele fallar por eso.
- **Mejor al final del día**, cuando ya tienes todos los pasos. Si lo repites, se actualiza con el valor más reciente.
- **Unidades:** si tu iPhone muestra la energía en kilojulios (kJ) en vez de kilocalorías, cámbialo en Salud → tu foto → *Unidades*.
- **Aquagym y entrenos sin GPS:** Zepp puede no enviar esos entrenos a Salud como tal. Las calorías activas del día pueden o no incluirlos: compara con lo que marca Zepp y, si falta, anota el entreno a mano en TupperFit → Ejercicio.
- **Peso (opcional):** también puede importarse; añade al texto ` peso 74.5`.
