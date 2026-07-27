# Instructivo: Gestión de Torneos

## Hockey Pista Bariloche — Panel Administrativo

---

## Índice

**Parte 1 — Torneos**

1. [Introducción](#1-introducción)
2. [Crear un torneo](#2-crear-un-torneo)
3. [Las tres pestañas del torneo](#3-las-tres-pestañas-del-torneo)
4. [Inscribir equipos](#4-inscribir-equipos)
5. [Armar el fixture](#5-armar-el-fixture)
6. [Crear un playoff a partir de una liga](#6-crear-un-playoff-a-partir-de-una-liga)
7. [Cargar resultados de un partido](#7-cargar-resultados-de-un-partido)
8. [Suspensiones](#8-suspensiones)
9. [Finalizar o eliminar un torneo](#9-finalizar-o-eliminar-un-torneo)

**Parte 2 — Personas y designaciones**

10. [Gestión de personas](#10-gestión-de-personas)
11. [Fichajes](#11-fichajes)
12. [Designación de árbitros](#12-designación-de-árbitros)
13. [Carga y gestión de partidos](#13-carga-y-gestión-de-partidos)

**Parte 3 — El sistema en general**

14. [Estadísticas y rankings](#14-estadísticas-y-rankings)
15. [Usuarios del sistema y sus funciones](#15-usuarios-del-sistema-y-sus-funciones)
16. [Otras secciones del panel](#16-otras-secciones-del-panel)
17. [Resumen rápido: ¿qué opción uso?](#17-resumen-rápido-qué-opción-uso)
18. [Glosario](#18-glosario)

# Parte 1 — Torneos

---

## 1. Introducción

Este instructivo explica **paso a paso** cómo se crea y administra un torneo en el sistema, qué opciones existen en cada etapa y para qué situación conviene cada una. Está pensado para cualquier persona con acceso al panel administrativo, sin necesidad de conocimientos técnicos.

Solo el rol **Superusuario** puede crear, editar, finalizar o eliminar torneos. Los roles Editor y Administrador pueden trabajar dentro de un torneo ya creado (cargar resultados, armar el fixture), pero no crearlo ni borrarlo.

### Qué ve el público

Todo lo que se carga desde el panel administrativo se refleja automáticamente en el **sitio público**, sin que nadie tenga que registrarse ni iniciar sesión para verlo:

| Sección pública | Qué muestra |
|---|---|
| **Inicio** | Estadísticas globales (partidos jugados y goles convertidos de todo el sistema), últimas noticias y últimos resultados. |
| **Clubes y equipos** | Listado de clubes, y dentro de cada uno sus equipos, planteles activos e historial de partidos. |
| **Posiciones** | Tabla de posiciones de cada torneo (o el cuadro de llaves, si es Playoff/Copa). |
| **Fixture** | Próximos partidos con fecha asignada (los partidos en estado Borrador no se muestran). |
| **Resultados** | Partidos ya jugados, con el detalle de goles, tarjetas y participantes de cada uno. |
| **Ranking / Estadísticas** | Goleadores, tarjetas y valla menos vencida de cada torneo (ver [sección 14](#14-estadísticas-y-rankings)). Las fechas de suspensión ya cumplidas se marcan con un asterisco junto al número de tarjetas (ver [sección 8](#8-suspensiones)). |
| **Noticias** | Noticias publicadas desde el panel, con fecha y contenido completo. |

El resto de este instructivo se centra en el panel administrativo: cómo cargar la información que después aparece en estas secciones públicas.

---

## 2. Crear un torneo

**Dónde:** Panel admin → **Torneos** → botón **Nuevo torneo**.

El formulario pide:

| Campo | Qué significa |
|---|---|
| **Nombre** | El nombre con el que se va a identificar el torneo (ej: "Liga Apertura 2026"). |
| **Categoría** | Mayores, Sub-19, Sub-16, Sub-14 o Sub-12. |
| **División** (opcional) | A, B o Desarrollo. |
| **Género** | Masculino, Femenino o Mixto. |
| **Tipo de torneo** | Liga o Copa (ver más abajo). |
| **Torneo base** (solo si el tipo es Copa) | Liga de la que hereda equipos y datos. En la práctica, esta opción rara vez se usa a mano: los Playoffs se generan directamente desde una Liga, como se explica en la [sección 6](#6-crear-un-playoff-a-partir-de-una-liga). |
| **Fecha de inicio** | Fecha en que arranca el torneo. |
| **Aplicar reglas de arbitraje** (casillero) | Si está tildado, un árbitro no puede dirigir un partido de un club en el que también cumple otro rol (jugador, entrenador, etc.). Se recomienda **destildarlo** en torneos formativos (Sub-12, Sub-14) donde esta restricción no aplica. |

### ¿Qué tipo de torneo elijo?

| Tipo | Cuándo usarlo |
|---|---|
| **Liga** | Torneo regular donde todos los equipos se enfrentan entre sí (todos contra todos). Es el punto de partida habitual: primero se juega la liga, y si hace falta, después se arma un playoff a partir de ella. |
| **Playoff** | Cuadro de eliminación directa (octavos, cuartos, semifinal, final). No se crea desde este formulario: se genera **desde una Liga ya existente**, en su pestaña Configuración → Play Off (ver [sección 6](#6-crear-un-playoff-a-partir-de-una-liga)). Por eso no aparece como opción acá. |
| **Copa** | Funciona igual que un Playoff (mismo cuadro de eliminación directa). Se usa para competencias especiales que no dependen de una liga previa — por ejemplo, un torneo relámpago entre clubes invitados. A diferencia del Playoff, sí se crea directamente desde este formulario. |

Una vez completado el formulario, hacer clic en **Guardar**. El torneo queda creado y activo, listo para inscribir equipos.

---

## 3. Las tres pestañas del torneo

Al entrar al detalle de un torneo (haciendo clic en él desde el listado de Torneos), se ven tres pestañas:

### 📊 Resumen
Es la pestaña que se abre por defecto. Muestra:
- La **tabla de posiciones** (o el cuadro de llaves, si es Playoff/Copa).
- Los **rankings**: goleadores, valla menos vencida y tarjetas acumuladas (versión Top 5; el detalle completo está en el sitio público, ver [sección 14](#14-estadísticas-y-rankings)).
- Al final de la página, la **Zona peligrosa**, con los botones para **Finalizar** o **Eliminar** el torneo (ver [sección 9](#9-finalizar-o-eliminar-un-torneo)).

### 📅 Fixture
Acá se arma y administra el calendario de partidos. Ver [sección 5](#5-armar-el-fixture).

Si la liga tiene uno o más playoffs generados a partir de ella, esta pestaña muestra dos sub-pestañas: **Fixture** (el calendario de la liga) y **Playoff** (el cuadro de ese playoff).

### ⚙️ Configuración
Tiene tres sub-secciones:
- **Información general**: los datos del torneo (nombre, categoría, división, género, fecha, reglas de arbitraje). Con el botón **✏️ Editar** se pueden modificar.
- **Inscripción de equipos**: alta y baja de equipos participantes (ver [sección 4](#4-inscribir-equipos)).
- **Play Off** (solo visible en torneos de tipo Liga): desde acá se generan los playoffs de esa liga (ver [sección 6](#6-crear-un-playoff-a-partir-de-una-liga)).

---

## 4. Inscribir equipos

**Dónde:** pestaña Configuración → Inscripción de equipos.

1. Hacer clic en **➕ Inscribir equipo**.
2. Elegir el equipo de la lista.
3. Confirmar.

Para dar de baja una inscripción, buscar el equipo en la lista y hacer clic en **Dar de baja**.

> En torneos de tipo Liga, solo se pueden inscribir equipos de la misma división. En Playoff y Copa esta restricción no existe: se pueden mezclar equipos de División A y B en el mismo cuadro.

---

## 5. Armar el fixture

**Dónde:** pestaña Fixture del torneo.

Hay dos formas de trabajar, y se pueden combinar según la necesidad:

### Opción A — Generar el calendario automáticamente
Ideal cuando ya se conocen los equipos inscriptos y se quiere el calendario completo de una sola vez.

1. Hacer clic en **⚡ Generar fixture**.
2. Elegir el formato:
   - **Solo ida**: cada par de equipos juega una sola vez.
   - **Ida y vuelta (espejo)**: se juega dos veces, la vuelta repite los mismos cruces con local/visitante invertido.
   - **Ida y vuelta (aleatoria)**: se juega dos veces, pero el orden de la vuelta se sortea (para no repetir el mismo cruce en fechas consecutivas).
3. Hacer clic en **Previsualizar fixture** para revisar el calendario completo antes de guardar nada.
4. Si el número de equipos es impar, en cada jornada figura cuál equipo descansa.
5. Hacer clic en **Confirmar y guardar**.

> Los partidos se crean en estado **Borrador** (no se ven en el sitio público) hasta que se les asigna una fecha concreta.
>
> Si el torneo ya tenía un fixture cargado, generar uno nuevo **elimina los partidos pendientes** (los que ya tienen resultado cargado no se pueden tocar).

### Opción B — Programar partido por partido (manual)
Ideal para torneos informales, o para completar/corregir partidos puntuales dentro de un fixture ya generado.

1. Hacer clic en **+ Programar partido**.
2. Completar: equipo local, equipo visitante, fecha, horario (opcional), ubicación (opcional) y número de fecha (o "ronda", si es un playoff).
3. Guardar.

### Editar o eliminar un partido
Cada partido en la lista tiene botones para:
- **Editar fixture**: cambiar fecha, horario, ubicación o estado.
- **Cargar resultado**: abre la planilla completa (ver [sección 7](#7-cargar-resultados-de-un-partido)).
- **Otorgar puntos**: atajo rápido para cargar solo el resultado numérico, sin planilla completa (sin goles ni tarjetas detalladas).
- **Eliminar**: borra ese partido puntual. Si ya tenía resultado cargado, se advierte que también se pierden los goles y tarjetas asociados.

El botón **Eliminar fixture** (arriba de la lista) borra todo el calendario del torneo de una vez (solo los partidos que no están terminados).

El botón **Exportar PDF** genera un PDF del fixture completo (requiere al menos un partido cargado).

### Estados de un partido

| Estado | ¿Se ve en el sitio público? | Significado |
|---|---|---|
| Borrador | No | Creado pero sin fecha asignada. |
| Pendiente | Sí | Tiene fecha, todavía no se jugó. |
| Terminado | Sí | Tiene planilla y resultado cargados. |
| Suspendido | Sí | El partido se suspendió. |
| Reprogramado | Sí | Se cambió la fecha original. |

---

## 6. Crear un playoff a partir de una liga

Los playoffs **no se crean desde el formulario general de "Nuevo torneo"**. Se generan siempre desde la liga que les da origen, para heredar automáticamente sus equipos, categoría, división y género.

**Dónde:** dentro de la Liga → pestaña Configuración → sub-pestaña **Play Off**.

1. Si la liga ya tiene playoffs creados, aparecen listados arriba con un botón **Abrir →** para entrar a cada uno.
2. Más abajo, completar el formulario **Crear playoff**:
   - **Nombre**: se autocompleta como "Playoff <nombre de la liga>" (se puede cambiar).
   - **Fecha de inicio**.
   - **Formato**: Solo ida o Ida y vuelta.
   - **Asignación de duelos**:
     - **Automático**: arma los cruces de la primera ronda según el orden de la tabla de posiciones de la liga. También hay que elegir la **ronda inicial** (por ejemplo, arrancar directamente en Cuartos si no todos los equipos clasifican) y, opcionalmente, tildar **partido por el 3er puesto**.
     - **Manual**: se eligen a mano los enfrentamientos de la primera ronda, agregando o quitando duelos con los botones **+ Agregar duelo** / **✕**.
3. Hacer clic en **Crear y generar bracket**.
4. El sistema crea el nuevo torneo tipo Playoff y arma el cuadro automáticamente. Si por algún motivo no puede armarlo solo (por ejemplo, cantidad impar de equipos), igual se entra al playoff recién creado para resolverlo a mano desde su propia pestaña Fixture.

> Solo se definen a mano los cruces de la **primera** ronda. Las siguientes rondas se completan solas a medida que se cargan los resultados: el ganador de cada partido avanza automáticamente al cruce correspondiente. En caso de empate en la serie, hay que definir el avance manualmente.

---

## 7. Cargar resultados de un partido

**Dónde:** botón **Cargar resultado** en el fixture, o directamente desde **Partidos → Nueva planilla** (sin necesidad de tener un fixture generado).

La planilla incluye:
- **Resultado**: goles del equipo local y visitante.
- **Participantes**: jugadores y cuerpo técnico presentes de cada plantel.
- **Goles**: jugador que lo hizo (o autogol), tipo (jugada, córner, penal o definición) y minuto.
- **Tarjetas**: jugador, tipo (verde, amarilla o roja) y minuto.

> En categoría **Sub-12** la planilla se simplifica: no se cargan goles ni tarjetas individuales, solo la lista de participantes.

Mientras la planilla no se marca como **Terminada** se puede seguir editando. Una vez terminada, la tabla de posiciones y las estadísticas se recalculan automáticamente.

Si solo se necesita cargar el marcador sin el detalle completo, usar el atajo **Otorgar puntos** desde el fixture.

---

## 8. Suspensiones

Cuando se cargan tarjetas en la planilla de un partido (ver [sección 7](#7-cargar-resultados-de-un-partido)), el sistema controla solo si corresponde una suspensión y, si es así, la genera **automáticamente**. No hace falta que nadie la cargue a mano.

### Reglas automáticas

| Situación | Sanción |
|---|---|
| **3 tarjetas amarillas** acumuladas por la misma persona en un mismo torneo | 1 fecha de suspensión |
| Cada 3 amarillas adicionales (6, 9, 12…) | 1 fecha más (el contador de amarillas nunca se reinicia) |
| **1 tarjeta roja** | 1 fecha de suspensión |

Las amarillas y las rojas se cuentan por separado: acumular rojas no descuenta ni suma al contador de amarillas, y viceversa.

### ¿Qué partido tiene que cumplir?

Siempre el **próximo partido que efectivamente se juegue** del equipo de esa persona en el torneo donde se originó la sanción — no importa el número de fecha del fixture, sino el orden real en que se disputan los partidos. Por ejemplo: si la sanción se originó en la fecha 5 y la fecha 6 se reprograma para más adelante, jugándose antes la fecha 7, la persona cumple en la fecha 7 (la primera que realmente se juega).

Si a la misma persona le corresponden **varias fechas de suspensión** a la vez, se cumplen una atrás de la otra: nunca se juntan dos sanciones en el mismo partido.

### Suspensiones manuales

Además de las automáticas, desde **Panel admin → Suspensiones** (rol Administrador o Superusuario) se puede cargar una sanción a mano — por ejemplo, por una decisión disciplinaria que no surge de una tarjeta puntual.

1. Buscar a la persona por apellido, nombre o documento (aparece una lista para elegir mientras se escribe).
2. Elegir el **torneo de origen**, si corresponde — este campo es **opcional**: si la sanción no está ligada a una competencia en particular (por ejemplo, una sanción disciplinaria general), se puede dejar sin torneo.
3. Elegir el tipo:
   - **Por partidos**: una cantidad determinada de fechas a cumplir.
   - **Por fecha**: suspendido hasta una fecha del calendario, sin importar cuántos partidos dispute en el medio.
4. Completar el motivo y guardar.

Una suspensión manual se puede **anular** en cualquier momento (queda registrada igual, solo cambia su estado).

### El aviso en la planilla

Mientras una persona tiene una suspensión vigente (sin cumplir todavía), aparece marcada como **"Suspendido"** en la planilla de carga de cualquier partido — no solo en el torneo donde se originó la sanción, sino en cualquier competencia en la que participe. Es un aviso para quien carga la planilla: el sistema no bloquea la carga, así que sigue siendo responsabilidad de quien completa la planilla no hacer jugar a esa persona.

> La sanción se **cumple** únicamente jugándose partidos del torneo donde se originó. Si la persona juega otro torneo mientras tanto, esos partidos no descuentan fechas — solo sirve para eso el próximo partido del torneo de origen.

### Cómo se ve en el sitio público

En **Ranking / Estadísticas → Tarjetas** (ver [sección 14](#14-estadísticas-y-rankings)), cada fecha de suspensión ya cumplida se marca con un **asterisco** al lado del número de tarjetas de ese color:

| Lo que se ve | Qué significa |
|---|---|
| `3` (amarillas, sin asterisco) | 3 amarillas acumuladas, pero la fecha de suspensión que generaron todavía no se cumplió (falta que se juegue el próximo partido). |
| `3*` | 3 amarillas acumuladas y la fecha correspondiente **ya se cumplió**. |
| `7**` | 7 tarjetas de ese color acumuladas en total, con **2 fechas** de suspensión ya cumplidas. |

Las suspensiones manuales no se ven reflejadas con asterisco en esta tabla (no tienen un color de tarjeta asociado), aunque sí quedan registradas en el panel administrativo.

---

## 9. Finalizar o eliminar un torneo

Ambas opciones están en la pestaña Resumen, en la **Zona peligrosa**, y solo el Superusuario puede usarlas.

### Finalizar torneo
- Marca el torneo como cerrado, pero **no borra ningún dato**.
- Se usa cuando el torneo **ya terminó de jugarse** y queda como historial.
- Se puede **reabrir** en cualquier momento con el botón **🔁 Reabrir torneo**, por si hace falta corregir algo.

### Eliminar torneo
- Borra el torneo **de forma permanente y definitiva**: partidos, goles, tarjetas e inscripciones se pierden para siempre. No hay forma de deshacerlo.
- Antes de confirmar, el sistema muestra cuántos partidos, goles, tarjetas e inscripciones se van a perder, para evitar borrados accidentales.
- **Solo se puede eliminar un torneo que esté activo** (si ya está finalizado, primero hay que reabrirlo). Esto es intencional: obliga a confirmar dos veces antes de borrar un torneo que ya se dio por cerrado.
- Está pensado para **torneos de prueba o cargados por error**, no para torneos reales ya jugados. Para esos, usar siempre **Finalizar**.

---

# Parte 2 — Personas y designaciones

---

## 10. Gestión de personas

**Dónde:** Panel admin → **Personas**. Requiere rol Administrador o Superusuario.

Una **persona** es cualquier individuo del sistema: jugador, árbitro, entrenador, delegado, médico, preparador físico, etc.

### Crear una persona

1. Hacer clic en **+ Nueva persona**.
2. Completar: nombre, apellido, DNI, fecha de nacimiento, género, email, teléfono y dirección.
3. Elegir un **rol inicial** (obligatorio: no se puede crear una persona sin al menos un rol).
4. Guardar.

### Roles de una persona

Los roles disponibles son: **Jugador, DT, Árbitro, Asistente, Médico, Preparador físico, Delegado**. Una misma persona puede tener varios roles a la vez (por ejemplo, ser jugador y también árbitro).

- **Agregar un rol**: en la ficha de la persona, sección "Roles Habilitantes" → **+ Asignar Nuevo Rol** → elegir el rol → **Confirmar Habilitación**.
- **Dar de baja un rol**: botón **Dar de Baja Rol** en la fila correspondiente. El rol no se borra, se cierra con fecha (queda el historial). No se puede cerrar un rol si la persona tiene un **fichaje vigente** con ese rol: primero hay que dar de baja el fichaje.

> Tener un rol habilitado **no significa** que la persona esté activa en un club: para eso hace falta un fichaje (ver [sección 11](#11-fichajes)).

### Eliminar una persona

El sistema revisa el "historial deportivo" de la persona antes de permitir el borrado:

- Si la persona **jugó en algún plantel o arbitró algún partido alguna vez**, la eliminación se **rechaza**: ese historial nunca se borra, sin importar cuánto tiempo haya pasado.
- Si la persona **nunca participó** (0 planteles, 0 arbitrajes) — por ejemplo, se cargó por error o nunca llegó a jugar — sí se puede eliminar de forma **definitiva**, junto con sus roles y fichajes. Esta acción no se puede deshacer.

---

## 11. Fichajes

**Dónde:** Panel admin → **Fichajes** (también se puede dar de alta un fichaje puntual desde el botón **⚡ Fichar** en la ficha de un club).

Un **fichaje** es el vínculo activo entre una persona, un club y un rol, con fecha de inicio (y de baja cuando corresponda). Es lo que define quién "pertenece" a qué club en cada momento — a diferencia del rol habilitante, que solo indica que la persona *puede* cumplir esa función en general.

### Crear un fichaje

1. Elegir el club en el selector superior (se muestra el plantel/personal actualmente fichado en ese club).
2. Hacer clic en **+ Nuevo Fichaje**.
3. Elegir el rol (Jugador, DT, Árbitro, Delegado, Asistente, Médico, Preparador físico).
4. Aparece la lista de personas **disponibles** para ese rol: solo se muestran quienes tienen el rol habilitado y que **no tengan ya un fichaje activo con ese rol en ningún otro club** (una persona no puede estar fichada como jugador en dos clubes a la vez).
5. Se pueden seleccionar varias personas juntas y confirmar con **Fichar seleccionados**.

### Dar de baja un fichaje

Botón **Dar de baja** en la fila correspondiente → pedir fecha de baja → confirmar. El fichaje **no se elimina**, solo se cierra con esa fecha (queda el historial de cuándo estuvo activo).

### Pase de un jugador entre clubes

Botón **Pase**: permite mover a la persona de un club a otro sin pasos separados. Al completar el club destino, el rol y la fecha, el sistema cierra el fichaje anterior y da de alta el nuevo en un solo paso.

---

## 12. Designación de árbitros

**Dónde:** Panel admin → **Designación de árbitros**. Requiere rol Administrador de árbitros o Superusuario.

Esta sección permite asignar quién dirige cada partido, antes de que se juegue.

1. Se listan los partidos en estado **Borrador** o **Pendiente**, filtrables por torneo.
2. Al abrir un partido, aparecen dos selectores: **Árbitro 1** y **Árbitro 2** (no se puede repetir la misma persona en ambos).
3. El sistema marca automáticamente como **no disponibles** (con el motivo) a las personas que no pueden dirigir ese partido puntual:
   - Nunca puede arbitrar quien integra un plantel de ese mismo torneo.
   - Si el torneo tiene tildada la opción **"Aplicar reglas de arbitraje"** (torneos competitivos), tampoco puede arbitrar quien tenga un rol activo en el club local o visitante de ese partido.
   - En torneos formativos (Sub-12, Sub-14, sin esa opción tildada) esta segunda restricción no aplica.
4. Elegidos los árbitros, hacer clic en **Guardar designación**.

---

## 13. Carga y gestión de partidos

**Dónde:** Panel admin → **Partidos**.

Esta pantalla centraliza todo lo relacionado a partidos, sea que vengan del fixture o se carguen sueltos:

- **Historial de encuentros**: tabla de todos los partidos, filtrable por torneo y fecha, con botones **Detalle** (ver planillas, goles, tarjetas y árbitros), **Editar** (abre la planilla) y **Eliminar** (borra el partido y todo lo asociado: goles, tarjetas y participantes — irreversible; **solo visible para el rol Superusuario**).
- **📋 Desde fixture**: muestra los partidos ya programados en el fixture para elegir uno y cargarle el resultado, o generar directamente su planilla vacía en PDF.
- **+ Cargar resultado**: abre una planilla en blanco para registrar un partido que **no** está en el fixture (por ejemplo, un amistoso o un partido que se jugó sin programación previa).
- **🖨️ Imprimir planilla vacía**: genera un PDF en blanco (para llevar a la cancha y completar a mano) eligiendo torneo y equipos, sin que el partido tenga que existir todavía en el sistema.

> En otras palabras: un partido puede cargarse desde el fixture (ya tiene fecha, torneo y equipos definidos) o "suelto" desde esta pantalla (se completa todo manualmente). Ambos caminos terminan en la misma planilla descripta en la [sección 7](#7-cargar-resultados-de-un-partido).

---

# Parte 3 — El sistema en general

---

## 14. Estadísticas y rankings

Estos datos no se cargan manualmente en ningún lado: se arman solos a partir de lo que ya se cargó en las planillas de los partidos.

### En el sitio público

Además de la tabla de posiciones, el sitio público tiene una sección aparte llamada **Ranking / Estadísticas**, con tres pestañas: **Goleadores**, **Tarjetas** y **Valla menos vencida**. Siempre se consultan **por torneo** (se elige el torneo en un selector, incluso torneos ya finalizados) — no existe un ranking combinado o histórico entre varios torneos a la vez.

En la pestaña Resumen del panel admin (sección 3) se ve una versión resumida (Top 5) de estos mismos rankings, para tener una vista rápida sin salir del torneo.

### En la página de Inicio

La portada del sitio público muestra dos números destacados: **Partidos jugados** y **Goles convertidos**. A diferencia de los rankings, estos dos números son **globales**: suman todos los torneos y toda la historia del sistema, no un torneo en particular.

### Categoría Sub-12

Al igual que la tabla de posiciones, los rankings de goleadores, tarjetas y valla menos vencida **no aplican a la categoría Sub-12** (en esa categoría no se cargan goles ni tarjetas individuales, solo participantes — ver [sección 7](#7-cargar-resultados-de-un-partido)). El sitio muestra un aviso indicando que esa categoría no registra estadísticas individuales.

### Actualización y exportación

Los rankings se actualizan **al instante** apenas se marca una planilla como Terminada, sin demoras ni procesos manuales de recálculo. Por ahora no hay forma de exportarlos o imprimirlos en PDF: solo se consultan en pantalla (a diferencia del fixture, que sí tiene su propio botón de exportación, ver [sección 5](#5-armar-el-fixture)).

---

## 15. Usuarios del sistema y sus funciones

**Dónde:** Panel admin → **Usuarios** (solo visible y accesible para el rol Superusuario).

### Roles existentes

| Rol | Qué puede hacer |
|---|---|
| **Lector** | Solo consulta información interna del panel. No puede cargar ni editar nada. |
| **Editor** | Puede cargar planillas de partidos y noticias, y exportar el fixture a PDF. |
| **Administrador** | Todo lo del Editor, más: gestión completa del fixture, personas, equipos, planteles y clubes. |
| **Administrador de árbitros** | Acceso exclusivo a la pantalla de **Designación de árbitros** (sección 11). No tiene por qué tener los demás permisos de Administrador. |
| **Superusuario** | Control total: además de todo lo anterior, gestiona torneos, clubes, usuarios y puede eliminar partidos y personas de forma definitiva. |

### Invitar un usuario nuevo

1. Hacer clic en **Invitar Nuevo Usuario**.
2. Ingresar el email y elegir el rol.
3. El sistema envía un correo de invitación. La persona invitada hace clic en el enlace, y en esa pantalla (`/completar-registro`) elige su nombre de usuario y una contraseña (mínimo 8 caracteres) para terminar de darse de alta.

> No existe registro público: solo se ingresa al sistema por invitación de un Superusuario.

### Cambiar el rol de un usuario

En el listado de usuarios, elegir el nuevo rol en el selector de la fila correspondiente. El cambio se aplica al instante, sin pasos adicionales.

### Activar o desactivar un usuario

Botón **Dar de Baja** / **Reactivar Cuenta** en cada fila. Un usuario desactivado no puede iniciar sesión, pero sus datos y su historial de acciones no se borran. No existe una opción para eliminar usuarios por completo, solo desactivarlos.

### Olvidé mi contraseña

En la pantalla de login, hacer clic en **¿Olvidaste tu contraseña?**, ingresar el email y seguir el enlace que llega por correo para definir una nueva.

---

## 16. Otras secciones del panel

El menú del panel muestra distintas opciones según el rol de quien inició sesión: cada persona ve solo las secciones que su rol le permite usar. Además de lo ya descripto, existen estas secciones:

### Clubes

**Dónde:** Panel admin → **Clubes**. Requiere rol Superusuario.

1. Hacer clic en **+ Nuevo club**.
2. Completar nombre, provincia, ciudad, dirección, teléfono y email.
3. Guardar.

Desde la ficha de un club se puede editar su información, subir un logo, y desde ahí mismo se accede a sus equipos y a su personal fichado (con el atajo **⚡ Fichar** para dar de alta un fichaje sin ir a la sección Fichajes).

### Equipos

**Dónde:** dentro de la ficha de un club → sus equipos listados.

1. Hacer clic en **Nuevo equipo**.
2. Completar nombre, categoría (Mayores, Sub-19, Sub-16, Sub-14, Sub-12), género y división.
3. Guardar.

Un equipo solo se puede eliminar si no tiene planteles, inscripciones a torneos ni partidos asociados (es decir, si nunca llegó a usarse).

### Planteles

**Dónde:** dentro del detalle de un equipo.

Un **plantel** es el grupo de integrantes activos de un equipo durante una temporada, armado a partir de los fichajes vigentes del club.

1. Hacer clic en **Nuevo plantel** e ingresar la temporada.
2. Hacer clic en **Agregar integrante**: se elige entre las personas con fichaje activo en ese club y se define su rol dentro del plantel (jugador, entrenador, etc.) y, opcionalmente, su número de camiseta.
3. Para dar de baja a alguien del plantel sin borrar su historial, usar **Dar de baja** en su fila.
4. Cuando termina la temporada, usar **Cerrar plantel** e ingresar la fecha de cierre. Un plantel cerrado no acepta nuevos integrantes — para la temporada siguiente se crea un plantel nuevo.

> Un plantel que tuvo jugadores no se puede eliminar, solo cerrar: es el que sostiene el historial deportivo de "quién jugó en qué equipo y cuándo".

### Noticias

**Dónde:** Panel admin → **Noticias**. Disponible desde el rol Editor en adelante.

1. Hacer clic en **Nueva noticia**.
2. Completar título, contenido e imagen (opcional). También se puede pegar la URL de una nota externa: el sistema trae automáticamente el título, la imagen y la descripción de esa página para previsualizarla antes de publicar.
3. Guardar para publicar de inmediato en el sitio público.

El listado muestra las últimas noticias publicadas, con opción de **Editar** o **Eliminar** cada una.

---

## Permisos por rol — tabla resumen

| Funcionalidad | Lector | Editor | Admin. | Admin. árbitros | Superusuario |
|---|---|---|---|---|---|
| Cargar planilla de partido | No | Sí | Sí | No | Sí |
| Eliminar partido | No | No | No | No | Sí |
| Generar / editar fixture | No | No | Sí | No | Sí |
| Crear playoff desde una liga | No | No | No | No | Sí |
| Designar árbitros | No | No | No | Sí | Sí |
| Gestionar personas y fichajes | No | No | Sí | No | Sí |
| Eliminar una persona | No | No | No | No | Sí |
| Gestionar equipos y planteles | No | No | Sí | No | Sí |
| Cargar / anular suspensiones manuales | No | No | Sí | No | Sí |
| Gestionar clubes | No | No | No | No | Sí |
| Crear, finalizar o eliminar torneos | No | No | No | No | Sí |
| Cargar / editar noticias | No | Sí | Sí | No | Sí |
| Gestionar usuarios | No | No | No | No | Sí |

---

## 17. Resumen rápido: ¿qué opción uso?

| Situación | Qué hacer |
|---|---|
| Empezar un campeonato regular todos-contra-todos | Crear torneo tipo **Liga** |
| Competencia especial entre clubes invitados, sin liga previa | Crear torneo tipo **Copa** |
| Fase eliminatoria después de una liga | Ir a la Liga → Configuración → Play Off |
| Ya sé todos los partidos de antemano | Generar fixture automático |
| Voy cargando partidos a medida que se juegan, sin calendario fijo | Programar partido manual o cargar planilla directo desde Partidos |
| Necesito el resultado ya, sin cargar goles ni tarjetas | Botón **Otorgar puntos** |
| El torneo terminó y quiero cerrarlo sin perder el historial | **Finalizar torneo** |
| Cargué un torneo de prueba o por error y quiero borrarlo del todo | **Eliminar torneo** (debe estar activo) |
| Un jugador nuevo se suma al club | Crear **persona** (si no existe) → asignarle rol **Jugador** → crear **fichaje** con ese club |
| Un jugador se va a otro club | Usar **Pase** en Fichajes (o dar de baja el fichaje y crear uno nuevo en el otro club) |
| Necesito asignar quién dirige un partido | Ir a **Designación de árbitros** |
| Se jugó un amistoso que no estaba en el fixture | Cargar desde **Partidos → + Cargar resultado** |
| Necesito la planilla en blanco para llevar a la cancha | **Partidos → Imprimir planilla vacía** |
| Necesito dar de alta a alguien del panel administrativo | **Usuarios → Invitar Nuevo Usuario** (solo Superusuario) |
| Quiero ver quién va ganando el torneo de goleadores/tarjetas | Sitio público → **Ranking / Estadísticas**, elegir el torneo |
| Necesito sancionar a alguien sin que venga de una tarjeta cargada en un partido | **Panel admin → Suspensiones** → cargar sanción manual |

---

## 18. Glosario

| Término | Definición |
|---|---|
| **Liga** | Torneo donde todos los equipos inscriptos se enfrentan entre sí. |
| **Playoff** | Cuadro de eliminación directa generado a partir de una liga. |
| **Copa** | Cuadro de eliminación directa independiente, sin liga previa. |
| **Fixture** | Calendario de partidos de un torneo. |
| **Bracket** | Representación visual del cuadro de un playoff/copa, con sus cruces y rondas. |
| **Ronda inicial** | La primera instancia del playoff en la que entran los equipos (Octavos, Cuartos, Semifinal, etc.). |
| **Planilla** | Registro completo de un partido: resultado, goles, tarjetas y participantes. |
| **Borrador / Pendiente / Terminado** | Estados posibles de un partido de fixture (ver tabla en la sección 5). |
| **Zona peligrosa** | Sección del torneo donde están las acciones de Finalizar y Eliminar. |
| **Finalizar** | Cerrar un torneo conservando todos sus datos; se puede reabrir. |
| **Eliminar** | Borrado permanente y sin vuelta atrás de un torneo (o de un partido/persona) y todo lo relacionado. |
| **Persona** | Cualquier individuo del sistema: jugador, árbitro, entrenador, delegado, etc. |
| **Rol habilitante** | Función que una persona puede cumplir (Jugador, DT, Árbitro, etc.). No implica pertenencia a un club: solo indica que puede cumplir esa función. |
| **Fichaje** | Vínculo activo entre una persona, un club y un rol, con fecha de inicio y de baja. Define la pertenencia real a un club en un momento dado. |
| **Plantel** | Conjunto de integrantes de un equipo (tomados de sus fichajes activos) durante una temporada. |
| **Designación** | Asignación de uno o dos árbitros a un partido antes de que se juegue. |
| **Ranking** | Listado de goleadores, valla menos vencida o tarjetas de un torneo, calculado en vivo a partir de las planillas cargadas. |
| **Estadísticas globales** | Los números de "Partidos jugados" y "Goles convertidos" en la portada del sitio público: suman todos los torneos, no uno solo. |
| **Suspensión** | Sanción que impide jugar durante una o más fechas. Puede generarse automáticamente (3 amarillas acumuladas o 1 roja) o cargarse manualmente. |
| **Fecha cumplida** | Cada partido del torneo de origen que la persona suspendida se pierde mientras la sanción está vigente. En el sitio público se marca con un asterisco junto al número de tarjetas. |

---

*Instructivo de gestión de torneos — Hockey Pista Bariloche*
