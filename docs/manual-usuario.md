# Manual de Usuario — Sistema de Gestión Hockey Pista Bariloche

## Índice

1. [Introducción](#introducción)
2. [Acceso al sistema](#acceso-al-sistema)
3. [Sitio público](#sitio-público)
4. [Panel administrativo](#panel-administrativo)
5. [Roles y permisos](#roles-y-permisos)
6. [Guías por rol](#guías-por-rol)
   - [Editor](#editor)
   - [Administrador](#administrador)
   - [Superusuario](#superusuario)

---

## Introducción

El Sistema de Gestión Hockey Pista Bariloche es una plataforma web que permite administrar torneos de hockey sobre pista. Incluye gestión de clubes, equipos, jugadores, partidos, fixture, tabla de posiciones, estadísticas y noticias.

El sistema tiene dos grandes áreas:

- **Sitio público**: accesible para cualquier persona sin necesidad de registrarse.
- **Panel administrativo**: restringido a usuarios autorizados con distintos niveles de acceso.

---

## Acceso al sistema

### Iniciar sesión

1. Ir a la sección **Login** del sitio.
2. Ingresar usuario y contraseña.
3. Hacer clic en **Iniciar sesión**.

> El sistema limita a 5 intentos de login por minuto como medida de seguridad.

### Recuperar contraseña

1. En la pantalla de login, hacer clic en **¿Olvidaste tu contraseña?**
2. Ingresar el correo electrónico asociado a la cuenta.
3. Revisar el correo y seguir el enlace recibido.
4. Ingresar la nueva contraseña y confirmarla.

### Usuarios nuevos (invitados)

Los usuarios nuevos reciben un correo de invitación enviado por un Superusuario. Al hacer clic en el enlace del correo, se accede a un formulario para completar el registro (elegir nombre de usuario y contraseña).

---

## Sitio público

El sitio público es accesible sin necesidad de iniciar sesión. Muestra la información actualizada del torneo en curso.

### Inicio

La página principal muestra:
- Estadísticas globales: cantidad de partidos jugados y goles marcados.
- Últimas noticias publicadas.
- Últimos resultados con opción de ver el detalle de cada partido.

### Clubes

- Listado de todos los clubes activos.
- Al ingresar a un club se ven sus equipos y planteles activos.

### Equipos

- Detalle del equipo: nombre, categoría, género.
- Plantel activo: jugadores, entrenadores y demás integrantes.
- Historial de partidos del equipo.

### Posiciones

- Tabla de posiciones por torneo.
- Columnas: Pos., Equipo, PJ, G, E, P, GF, GC, Dif, Pts.
- Se actualiza automáticamente al cargar los resultados de los partidos.

Para torneos de tipo **Playoff** o **Copa**, en lugar de la tabla de posiciones se muestra el **cuadro de llaves**:

- Cada ronda aparece como una columna (Cuartos, Semifinal, Final, etc.).
- Los cruces muestran los equipos enfrentados; si aún no están definidos, aparece el marcador de posición (ej: "Ganador SF1").
- El ganador de cada cruce se resalta en verde; el perdedor aparece opaco.
- Las flechas conectan los cruces entre rondas para mostrar el avance.

### Ranking

- **Goleadores**: top 10 de jugadores con más goles en el torneo.
- **Valla menos vencida**: equipos que menos goles recibieron.
- **Tarjetas acumuladas**: jugadores con más tarjetas (amarillas y rojas).

### Fixture

- Próximos partidos con fecha asignada (estado Pendiente, Suspendido o Reprogramado).
- Información de fecha, horario, equipos y ubicación.
- Filtrable por torneo.
- Los partidos en estado Borrador (sin fecha asignada) no aparecen en esta sección.

### Resultados

- Partidos ya jugados con resultado final.
- Al hacer clic en un partido se puede ver el detalle: goles, tarjetas y participantes.

### Noticias

- Listado de noticias publicadas con fecha.
- Al hacer clic en una noticia se abre el contenido completo.

---

## Panel administrativo

El panel administrativo está disponible en `/admin` para usuarios autenticados. Las opciones visibles dependen del rol asignado.

---

## Roles y permisos

El sistema tiene cuatro roles de usuario:

| Rol | Descripción |
|-----|-------------|
| **Lector** | Solo puede ver información interna. Sin acceso a edición. |
| **Editor** | Puede cargar planillas de partidos y programar fixture. |
| **Administrador** | Gestiona personas, equipos, planteles, fichajes y noticias. |
| **Superusuario** | Control total del sistema: clubes, torneos, usuarios. |

### Tabla de permisos por entidad

| Funcionalidad | Editor | Admin | Superusuario |
|---------------|--------|-------|--------------|
| Cargar planilla de partido | Sí | Sí | Sí |
| Eliminar partido | No | No | Sí |
| Programar / editar fixture | Sí | No | Sí |
| Generar fixture automático | Sí | No | Sí |
| Eliminar fixture completo | Sí | No | Sí |
| Crear y editar noticias | No | Sí | Sí |
| Gestionar personas | No | Sí | Sí |
| Gestionar equipos | No | Sí | Sí |
| Gestionar planteles | No | Sí | Sí |
| Gestionar fichajes | No | Sí | Sí |
| Gestionar clubes | No | No | Sí |
| Gestionar torneos | No | No | Sí |
| Gestionar usuarios | No | No | Sí |

---

## Guías por rol

---

### Editor

El rol **Editor** es para quienes cargan resultados de partidos y programan el fixture.

#### Cargar planilla de partido

1. Ir a **Partidos** en el panel admin.
2. Hacer clic en **Nueva planilla**.
3. Seleccionar el torneo y los equipos (local y visitante).
4. Completar:
   - **Resultado final**: goles del equipo local y visitante.
   - **Participantes**: jugadores, árbitros y delegados que estuvieron en el partido.
   - **Goles**: para cada gol indicar el anotador, asistidor (opcional) y tipo (jugada, corner, penal, definición).
   - **Tarjetas**: tipo (amarilla o roja), jugador y minuto.
5. Guardar como **Borrador** para continuar después, o marcar como **Terminado** para publicar el resultado.

> Una planilla en estado **Borrador** puede editarse. Una vez **Terminada**, la tabla de posiciones se actualiza automáticamente.

#### Editar una planilla existente

1. Ir a **Partidos**.
2. Buscar el partido y hacer clic en **Editar**.
3. Realizar los cambios y guardar.

#### Programar partido de fixture manualmente

1. Ir a **Fixture** en el panel admin.
2. Seleccionar el torneo en el selector superior.
3. Hacer clic en **+ Programar partido**.
4. Ingresar: equipos (local y visitante), número de fecha, fecha, horario y ubicación.
5. Guardar. El partido queda en estado **Pendiente** (visible al público).

#### Generar fixture automático (round-robin)

El sistema puede generar el calendario completo de un torneo de forma automática a partir de los equipos inscriptos. Esta opción está disponible para torneos de tipo **Liga**.

1. Ir a **Fixture** en el panel admin.
2. Seleccionar el torneo.
3. Hacer clic en **⚡ Generar fixture**. Se despliega el panel de generación.
4. Elegir el tipo:
   - **Solo ida**: cada par de equipos se enfrenta una sola vez.
   - **Ida y vuelta (espejo)**: cada par se enfrenta dos veces; la vuelta reproduce los mismos enfrentamientos de la ida pero con local y visitante invertidos.
   - **Ida y vuelta (vuelta aleatoria)**: cada par se enfrenta dos veces; el orden de la vuelta es aleatorio para evitar que los mismos equipos se enfrenten en fechas consecutivas.
5. Hacer clic en **Previsualizar**. El sistema muestra todos los partidos ordenados por jornada antes de guardar nada.
6. Revisar el preview. Si hay número impar de equipos, en cada jornada aparecerá un equipo marcado como **Descansa**.
7. Hacer clic en **Confirmar y guardar** para crear el fixture.

> Los partidos generados se crean en estado **Borrador** (no visibles al público). Para que aparezcan en el sitio público, hay que asignarles una fecha manualmente (ver abajo).

> Si el torneo ya tenía partidos programados, el sistema los elimina al generar un fixture nuevo. El sistema avisa si hay partidos en estado avanzado (jugados, etc.) para que el Editor confirme antes de proceder.

#### Generar bracket de playoff

Para torneos de tipo **Playoff** o **Copa**, el sistema genera un cuadro de eliminación directa en lugar del round-robin.

1. Ir a **Fixture** en el panel admin.
2. Seleccionar un torneo de tipo Playoff o Copa.
3. Hacer clic en **⚡ Generar fixture**. Se despliega el panel de generación de playoff.
4. Elegir las opciones:
   - **Formato**: **Solo ida** (cada serie se define en un partido) o **Ida y vuelta** (dos partidos por serie, el ganador se determina por el global de goles).
   - **Asignación de cruces**: **Automático** o **Manual** (ver más abajo).
5. Hacer clic en **Previsualizar**. El sistema muestra el bracket completo con todos los cruces antes de guardar.
6. Revisar el preview y hacer clic en **Confirmar y guardar** para crear el bracket.

**Asignación automática:**
El sistema toma los equipos inscriptos y arma los cruces de la primera ronda al azar. Las rondas siguientes se generan automáticamente con marcadores de posición ("Ganador SF1", "Ganador C1", etc.).

**Asignación manual:**
Permite elegir exactamente quién juega contra quién en la primera ronda.
1. Seleccionar **Manual** en la opción de asignación.
2. Aparece la lista de **Duelos** con selectores de equipo local y visitante.
3. Completar cada enfrentamiento: elegir el equipo local y el visitante para cada cruce.
4. Usar **+ Agregar duelo** para sumar más cruces, o **✕** para quitar uno.
5. Hacer clic en **Previsualizar** para ver el bracket antes de guardar.

> En el modo manual solo se definen los cruces de la primera ronda. Las rondas siguientes (Semifinal, Final, etc.) se generan automáticamente con placeholders que se reemplazan cuando se cargan los resultados.

**Cómo funciona el bracket:**
- Se calculan las rondas necesarias según la cantidad de equipos: Final, Semifinal, Cuartos de Final, Octavos, etc.
- Si el número de equipos no es una potencia de 2 (4, 8, 16…), se agrega una ronda de **Repechaje** donde los equipos "extra" se enfrentan. Los que no entran en el Repechaje avanzan directamente (BYE).
- **Avance automático de ganadores**: cuando se carga la planilla de un partido y queda en estado **Terminado**, el sistema asigna automáticamente al equipo ganador en el cruce de la siguiente ronda. En formato ida y vuelta, espera que terminen ambos partidos de la serie antes de determinar el ganador por diferencia de goles.
- En caso de empate (simple o ida y vuelta), el avance no es automático: hay que editar el partido siguiente manualmente.

> Los partidos de playoff también se crean en estado **Borrador**. Para publicarlos hay que asignarles una fecha (igual que en el fixture de liga).

> Para torneos de Playoff o Copa, la inscripción de equipos **no tiene restricción de división**: se pueden inscribir equipos de División A y División B en el mismo torneo.

#### Asignar fecha a un partido (BORRADOR → Pendiente)

Los partidos generados automáticamente comienzan en estado **Borrador** y no son visibles al público. Para publicarlos:

1. En la lista de fixture, hacer clic en **Editar** junto al partido.
2. Ingresar la **Fecha programada** (y opcionalmente horario y ubicación).
3. Guardar. El partido cambia automáticamente a **Pendiente** y aparece en el sitio público.

> Si se quita la fecha de un partido Pendiente, vuelve a Borrador y deja de verse en el público.

#### Estados de los partidos de fixture

| Estado | Visible al público | Descripción |
|--------|-------------------|-------------|
| Borrador | No | Creado pero sin fecha asignada |
| Pendiente | Sí | Tiene fecha asignada, aún no se jugó |
| Terminado | Sí | Planilla cargada con resultado |
| Suspendido | Sí | Partido suspendido |
| Reprogramado | Sí | Partido reprogramado |

#### Editar o eliminar un partido de fixture

1. Ir a **Fixture**.
2. Buscar el partido y hacer clic en **Editar** o **Eliminar**.

> Solo se pueden eliminar partidos desde el panel admin. Para eliminar todo el fixture de un torneo, usar el botón **Eliminar fixture** en el panel de generación.

---

### Administrador

El rol **Administrador** incluye todo lo que puede hacer el Editor, más la gestión de personas, equipos, planteles, fichajes y noticias.

#### Gestionar personas

Una **persona** es cualquier individuo en el sistema: jugador, árbitro, entrenador, delegado, etc.

**Crear persona:**
1. Ir a **Personas** en el panel admin.
2. Hacer clic en **Nueva persona**.
3. Completar nombre, apellido, documento, fecha de nacimiento, género y rol inicial.
4. Guardar.

**Agregar rol a una persona:**
1. Ingresar al detalle de la persona.
2. Hacer clic en **Agregar rol**.
3. Seleccionar el nuevo rol.

**Cerrar rol:**
1. En el detalle de la persona, ir al rol activo.
2. Hacer clic en **Dar de baja** e ingresar la fecha de cierre.

**Eliminar persona:**
- Usar con precaución. El sistema conserva los datos (no se eliminan físicamente).

---

#### Gestionar equipos

**Crear equipo:**
1. Ir a **Equipos** en el panel admin.
2. Hacer clic en **Nuevo equipo**.
3. Completar nombre, categoría (Mayores, Sub-19, Sub-16, etc.), género y club al que pertenece.
4. Guardar.

**Editar equipo:**
1. Ingresar al detalle del equipo.
2. Editar los datos y guardar.

---

#### Gestionar planteles

Un **plantel** es el grupo de integrantes activos de un equipo en una temporada.

**Crear plantel:**
1. Ir al detalle del equipo.
2. Hacer clic en **Nuevo plantel**.
3. Ingresar la temporada y guardar.

**Agregar integrante:**
1. En el plantel activo del equipo, hacer clic en **Agregar integrante**.
2. Seleccionar la persona y su rol dentro del plantel (jugador, entrenador, etc.).
3. Opcionalmente, ingresar el número de camiseta.
4. Guardar.

**Cerrar plantel:**
1. En el detalle del plantel, hacer clic en **Cerrar plantel**.
2. Ingresar la fecha de cierre y confirmar.

> Un plantel cerrado ya no acepta nuevos integrantes. Para agregar más, se debe crear un nuevo plantel.

---

#### Gestionar fichajes

Un **fichaje** vincula a una persona con un club en un rol específico (jugador, árbitro, etc.) durante un período.

**Crear fichaje:**
1. Ir a **Fichajes** en el panel admin.
2. Hacer clic en **Nuevo fichaje**.
3. Seleccionar la persona, el club, el rol y la fecha de inicio.
4. Guardar.

**Dar de baja un fichaje:**
1. Buscar el fichaje activo.
2. Hacer clic en **Dar de baja** e ingresar la fecha de finalización.

---

#### Gestionar noticias

**Crear noticia:**
1. Ir a **Noticias** en el panel admin.
2. Hacer clic en **Nueva noticia**.
3. Completar título, contenido e imagen (opcional).
4. Guardar para publicar.

> También se puede pegar una URL externa para previsualizar automáticamente el título, imagen y descripción de ese contenido.

**Editar noticia:**
1. En el listado de noticias, hacer clic en **Editar**.
2. Realizar los cambios y guardar.

**Eliminar noticia:**
1. En el listado de noticias, hacer clic en **Eliminar**.
2. Confirmar la acción.

> Las noticias eliminadas no se borran permanentemente y pueden recuperarse si es necesario.

---

### Superusuario

El rol **Superusuario** tiene acceso total al sistema. Incluye todo lo que pueden hacer Editor y Administrador, más la gestión de clubes, torneos y usuarios.

#### Gestionar clubes

**Crear club:**
1. Ir a **Clubes** en el panel admin.
2. Hacer clic en **Nuevo club**.
3. Ingresar nombre y ubicación.
4. Guardar.

**Editar o eliminar club:**
1. Ingresar al detalle del club.
2. Editar los datos, o hacer clic en **Eliminar** para desactivarlo.

> Los clubes eliminados pueden restaurarse desde el detalle del club.

---

#### Gestionar torneos

**Crear torneo:**
1. Ir a **Torneos** en el panel admin.
2. Hacer clic en **Nuevo torneo**.
3. Ingresar nombre, fecha de inicio y fecha de fin.
4. Elegir el **tipo** de torneo:
   - **Liga**: torneo regular con fixture round-robin. Todos los equipos son de la misma división.
   - **Playoff**: cuadro de eliminación directa. Permite inscribir equipos de distintas divisiones.
   - **Copa**: igual que Playoff; se usa para competencias especiales o de copa.
5. Guardar.

**Inscribir equipos en un torneo:**
1. Ingresar al detalle del torneo.
2. Hacer clic en **Inscribir equipo**.
3. Seleccionar el equipo y confirmar.

**Dar de baja una inscripción:**
1. En el detalle del torneo, ir a la lista de inscripciones.
2. Hacer clic en **Dar de baja** junto al equipo.

**Finalizar torneo:**
1. En el detalle del torneo, hacer clic en **Finalizar torneo**.
2. Confirmar la acción.

> Un torneo finalizado puede reabrirse si es necesario.

---

#### Gestionar usuarios

**Invitar usuario:**
1. Ir a **Usuarios** en el panel admin.
2. Hacer clic en **Invitar usuario**.
3. Ingresar el correo electrónico del nuevo usuario.
4. El sistema enviará un email con un enlace para completar el registro.

**Cambiar rol de usuario:**
1. En el listado de usuarios, hacer clic en el usuario.
2. Seleccionar el nuevo rol (Editor, Administrador, Superusuario).
3. Guardar.

**Activar o desactivar usuario:**
1. En el listado de usuarios, hacer clic en **Activar** o **Desactivar** según corresponda.

---

## Glosario

| Término | Definición |
|---------|------------|
| **Club** | Organización deportiva que agrupa uno o más equipos. |
| **Equipo** | Grupo de jugadores que compiten bajo el nombre de un club en una categoría específica. |
| **Persona** | Individuo registrado en el sistema (jugador, árbitro, entrenador, delegado, etc.). |
| **Plantel** | Conjunto de integrantes activos de un equipo en una temporada. |
| **Fichaje** | Vinculación oficial de una persona a un club en un rol y período determinado. |
| **Planilla** | Registro completo de un partido: resultado, goles, tarjetas y participantes. |
| **Fixture** | Programación de partidos futuros (fecha, horario, equipos). Puede generarse automáticamente con el algoritmo round-robin. |
| **Borrador** | Estado de un partido de fixture sin fecha asignada. No es visible al público. |
| **Pendiente** | Estado de un partido de fixture con fecha asignada. Visible al público en la sección Fixture. |
| **Descansa** | En torneos con número impar de equipos, cada jornada un equipo queda libre. El sistema lo asigna aleatoriamente al generar el fixture. |
| **Round-robin** | Formato de fixture en el que todos los equipos se enfrentan entre sí. Puede ser solo ida, ida y vuelta espejo, o ida y vuelta con vuelta aleatoria. |
| **Torneo** | Competencia oficial en la que participan equipos inscriptos. Puede ser de tipo Liga, Playoff o Copa. |
| **Playoff** | Formato de eliminación directa. Los equipos perdedores quedan eliminados; los ganadores avanzan a la siguiente ronda. |
| **Bracket** | Cuadro visual del playoff que muestra todos los cruces y rondas. |
| **BYE** | Cuando el número de equipos no es par exacto, algunos equipos pasan directamente a la siguiente ronda sin jugar. |
| **Placeholder** | Marcador de posición en el bracket (ej: "Ganador SF1") que se reemplaza automáticamente cuando se carga el resultado del partido anterior. |
| **Tarjeta amarilla** | Amonestación. Se acumula; cierta cantidad puede generar suspensión. |
| **Tarjeta roja** | Expulsión directa. Genera suspensión automática. |
| **Soft delete** | El sistema no elimina datos permanentemente; los marca como inactivos para preservar el historial. |

---

*Versión 1.0 — Sistema de Gestión Hockey Pista Bariloche*
