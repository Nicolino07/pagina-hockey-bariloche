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

### Ranking

- **Goleadores**: top 10 de jugadores con más goles en el torneo.
- **Valla menos vencida**: equipos que menos goles recibieron.
- **Tarjetas acumuladas**: jugadores con más tarjetas (amarillas y rojas).

### Fixture

- Próximos partidos programados.
- Información de fecha, horario, equipos y ubicación.
- Filtrable por torneo.

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
| Programar / editar fixture | Sí | No | No |
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

#### Programar fixture

1. Ir a **Fixture** en el panel admin.
2. Hacer clic en **Nuevo partido**.
3. Ingresar: equipos (local y visitante), fecha, horario, ubicación y número de fecha del torneo.
4. Guardar.

#### Editar o eliminar fixture

1. Ir a **Fixture**.
2. Buscar el partido y hacer clic en **Editar** o **Eliminar**.

> Solo se pueden eliminar partidos que aún no se jugaron.

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
4. Guardar.

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
| **Fixture** | Programación de partidos futuros (fecha, horario, equipos). |
| **Torneo** | Competencia oficial en la que participan equipos inscriptos. |
| **Tarjeta amarilla** | Amonestación. Se acumula; cierta cantidad puede generar suspensión. |
| **Tarjeta roja** | Expulsión directa. Genera suspensión automática. |
| **Soft delete** | El sistema no elimina datos permanentemente; los marca como inactivos para preservar el historial. |

---

*Versión 1.0 — Sistema de Gestión Hockey Pista Bariloche*
