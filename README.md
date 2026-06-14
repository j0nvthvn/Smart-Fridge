# SmartFridge

SmartFridge es una aplicación móvil para la gestión inteligente de alimentos del refrigerador.  
Permite registrar productos, consultar inventario, visualizar alertas de vencimiento y apoyar la reducción del desperdicio de comida en el hogar.

Proyecto desarrollado para la asignatura **Ingeniería de Software**.  
Grupo 4 — Sección Jordan Barría Pineda.

## Integrantes

- Felipe Bustos
- Jonathan Flores
- Patricio Parra
- Cristóbal Sepúlveda

## Objetivo del proyecto

El objetivo de SmartFridge es entregar una herramienta móvil que ayude a los usuarios a mantener control sobre los alimentos que tienen disponibles, sus fechas de vencimiento y su reposición.

La aplicación busca resolver problemas comunes como:

- Pérdida de alimentos por vencimiento.
- Falta de visibilidad sobre productos disponibles.
- Dificultad para organizar compras futuras.
- Necesidad de registrar alimentos de forma rápida mediante escáner o ingreso manual.

## Estado actual del proyecto

La aplicación se encuentra en Sprint 2. Cuenta con un MVP funcional que incluye:

- Inicio de sesión y registro de usuarios mediante Supabase Auth.
- Persistencia de sesión local con AsyncStorage.
- Registro manual de productos.
- Escaneo de códigos de barra y QR mediante cámara.
- Consulta automática de nombre y marca del producto escaneado usando la API de Open Food Facts.
- Categorización de productos con íconos y colores por categoría.
- Inventario persistente en Supabase.
- Visualización de productos guardados.
- Edición y eliminación de productos.
- Alertas de vencimiento según fecha registrada.
- Resumen de productos totales, productos por vencer y productos vencidos.

## Tecnologías utilizadas

- React Native
- Expo
- JavaScript
- Supabase
- Supabase Auth
- PostgreSQL
- Row Level Security (RLS)
- AsyncStorage
- Expo Camera
- React Navigation
- Open Food Facts API

## Funcionalidades principales

### Autenticación

La aplicación permite crear una cuenta e iniciar sesión usando correo electrónico y contraseña.

La sesión del usuario se mantiene localmente mediante AsyncStorage, permitiendo conservar el estado de autenticación entre aperturas de la app.

### Inicio

La pantalla de inicio muestra un resumen del estado del refrigerador:

- Cantidad total de productos.
- Productos próximos a vencer.
- Productos vencidos.
- Alertas de vencimiento.

### Inventario

La pantalla de inventario permite:

- Ver todos los productos guardados.
- Buscar productos por nombre, categoría o código.
- Editar productos existentes.
- Eliminar productos del inventario.
- Refrescar la información desde Supabase.

### Escáner

La pantalla de escáner permite registrar productos de dos formas:

- Escaneo de código de barras usando la cámara del dispositivo. Al detectar un código, la app consulta la API de Open Food Facts para obtener automáticamente el nombre y la marca del producto.
- Ingreso manual de producto mediante formulario.

Los productos registrados se almacenan en Supabase asociados al usuario autenticado. Cada producto puede tener asignada una categoría (Lácteos, Carnes, Frutas, Verduras, Bebidas, Congelados, Despensa, Snacks u Otro), que se muestra con un ícono y color representativo en el inventario.

### Cuenta

La pantalla de cuenta permite visualizar información del usuario y opciones generales de configuración.

## Arquitectura general

La arquitectura actual se basa en una aplicación móvil conectada a Supabase como backend principal.

```text
Usuario
  |
  v
App móvil SmartFridge
React Native + Expo
  |
  |-- Supabase Auth
  |     - Registro
  |     - Login
  |     - Sesión de usuario
  |
  |-- Supabase PostgreSQL
  |     - Tabla products
  |     - Tabla profiles
  |     - Row Level Security por usuario
  |
  |-- AsyncStorage
  |     - Persistencia local de sesión
  |
  |-- Cámara del dispositivo
  |     - Escaneo de códigos de barra / QR
  |
  |-- Open Food Facts API
        - Consulta de nombre y marca por código de barras
```

## Modelo C4

### Nivel 1 — Contexto

SmartFridge es utilizado por usuarios del hogar que desean registrar y controlar los alimentos disponibles en su refrigerador.

El sistema se relaciona con:

- **Usuario del hogar**: registra productos, revisa inventario y consulta alertas.
- **Supabase**: gestiona autenticación y persistencia de datos.
- **Servicio OCR/IA futuro**: permitirá procesar boletas para extraer productos automáticamente.
- **Servicio de notificaciones futuro**: permitirá enviar alertas cuando un producto esté próximo a vencer.

### Nivel 2 — Contenedores

Los principales contenedores de la plataforma son:

| Contenedor | Tecnología | Responsabilidad |
|---|---|---|
| App móvil SmartFridge | React Native + Expo | Interfaz de usuario, navegación, escáner, formularios e inventario |
| Supabase Auth | Supabase | Registro, login y sesión de usuarios |
| Base de datos | PostgreSQL en Supabase | Persistencia de productos, perfiles y vencimientos |
| AsyncStorage | React Native AsyncStorage | Persistencia local de sesión |
| Cámara del dispositivo | Expo Camera | Lectura de códigos de barra y QR |
| Open Food Facts API | API REST pública | Consulta de nombre y marca de productos por código de barras |
| Servicio OCR/IA | Por definir | Procesamiento futuro de boletas |
| Notificaciones push | Por definir | Alertas futuras de vencimiento |

## Estructura del proyecto

```text
Smart-Fridge/
├── App.js
├── package.json
├── .env.example
├── README.md
├── supabase/
│   └── products.sql
└── src/
    ├── components/
    │   ├── SectionHeader.js
    │   └── SettingsRow.js
    ├── constants/
    │   ├── categories.js        # Categorías de productos con íconos y colores
    │   └── colors.js
    ├── context/
    │   ├── AuthContext.js
    │   └── InventoryContext.js
    ├── hooks/
    │   └── useOpenFoodFacts.js  # Hook para consulta de productos por código de barras
    ├── screens/
    │   ├── HomeScreen.js
    │   ├── InventoryScreen.js
    │   ├── ScannerScreen.js
    │   ├── SettingsScreen.js
    │   ├── LoginScreen.js
    │   └── RegisterScreen.js
    ├── services/
    │   ├── openFoodFactsService.js  # Integración con la API de Open Food Facts
    │   └── supabase.js
    ├── types/                   # Tipos y definiciones (en expansión)
    └── utils/                   # Funciones utilitarias (en expansión)
```

## Requisitos

Antes de ejecutar el proyecto, se necesita tener instalado:

- Node.js 18 o superior.
- npm.
- Expo CLI o uso de `npx expo`.
- Aplicación Expo Go en un dispositivo móvil, o un emulador Android/iOS.
- Proyecto Supabase configurado.

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/j0nvthvn/Smart-Fridge.git
cd Smart-Fridge
```

Instalar dependencias:

```bash
npm install
```

Crear archivo de variables de entorno:

```bash
cp .env.example .env
```

Configurar las variables en `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Iniciar el proyecto:

```bash
npx expo start
```

Luego escanear el QR con Expo Go o ejecutar en un emulador.

## Configuración de Supabase

La aplicación utiliza Supabase para autenticación y base de datos.

### Variables de entorno necesarias

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Scripts disponibles

Iniciar Expo:

```bash
npm start
```

Ejecutar en Android:

```bash
npm run android
```

Revisar configuración de Expo:

```bash
npm run doctor
```

## Paleta de colores

- Verde principal: `#2CA456`
- Verde oscuro: `#1E7A3F`
- Fondo: `#F8F9FA`
- Blanco: `#FFFFFF`

## Sprint 1 — Completado

Durante el Sprint 1 se construyó la base funcional de la aplicación. Objetivo: crear la interfaz visual base (paleta verde/blanca) y desarrollar la autenticación para que los usuarios puedan registrarse e iniciar sesión.

Tareas completadas (todas en estado Done):

- Maquear Home (Verde/Blanco) — Jonathan, 1 pt
- Vistas Escáner y Ajustes — Jonathan, 2 pts
- Navegación principal por pestañas — Jonathan, 2 pts
- Alertas de vencimiento en Home — Jonathan, 2 pts
- Mejoras UI (paleta y pantallas) — Jonathan, 2 pts
- Documentación README — Jonathan, 3 pts
- Login y Registro — Patricio, 3 pts
- Base de datos (products.sql, RLS) — Patricio, 3 pts
- Contexto de inventario + Supabase — Patricio, 3 pts
- Pantalla de inventario (CRUD) — Patricio, 3 pts
- Mejoras escáner y código de barras — Patricio, 3 pts

## Sprint 2 — Completado

### Objetivo del Sprint 2

Organizar y mejorar la experiencia del inventario: categorizar productos, permitir monitorear vencimientos de forma visual, integrar Open Food Facts para autocompletar datos al escanear, y robustecer la app con validación de formularios y manejo de errores.

Historias de usuario atendidas (User Story Map Sprint 2):

- **H.U. Módulo 1** — Como usuario que quiere identificar sus productos por categoría, quiero poder filtrar mis productos para organizarlos por categorías. *(sistema de categorías con íconos y colores)*
- **H.U. Módulo 2** — Como usuario que quiere organizar cuándo caducan sus productos, quiero monitorear y consultar el inventario visualmente. *(ordenamiento por vencimiento, chips de estado, alertas)*
- **H.U. Módulo 3** — Como usuario con dudas de alimentos caducados, quiero recibir asistencia sobre el estado de mis productos. *(manejo de errores, validación, mensajes claros)*
- **H.U. Módulo 4** — Como usuario que planifica sus compras mensuales, quiero generar una lista automática de productos por vencer o terminados. *(base para Sprint 3)*

### Completado en Sprint 2

- Integración con la API de Open Food Facts para obtener nombre y marca al escanear un código de barras.
- Sistema de categorías de productos con íconos y colores diferenciados por categoría.
- Refactorización del servicio de escáner en hook reutilizable (`useOpenFoodFacts`).
- Manejo centralizado de errores de red y Supabase (`errorUtils.js`) con mensajes en español.
- Validación de formularios en escáner e inventario: nombre requerido con feedback visual (borde rojo), fecha en formato AAAA-MM-DD, cantidad mayor a 0.
- Ordenamiento del inventario por tres criterios: más reciente, por fecha de vencimiento (ascendente) y alfabético A–Z.
- Documentación técnica actualizada (README, src/).

### Pendiente / Sprint 3

Según el Product Backlog priorizado y User Story Map actualizado en Lucid:

- **Alta prioridad**: Organización de productos — filtrado avanzado y mejoras de categorización.
- **Alta prioridad**: Monitoreo y consulta — calendario visual de vencimientos.
- **Media prioridad**: Lista de compras inteligente a partir de productos por vencer o terminados.
- **Media prioridad**: Visualización — accesibilidad para usuarios con dificultad visual.
- **Baja prioridad**: Información de seguridad alimentaria — indicador de si es seguro consumir productos caducados (requiere base de datos externa).
- Notificaciones push para productos próximos a vencer.
- Pruebas manuales de los flujos principales.

## Sprint 2 — Retrospectiva

### Lo que funcionó bien

- La integración con Open Food Facts redujo significativamente el tiempo de registro de productos escaneados.
- La separación en hook (`useOpenFoodFacts`) hizo el código más reutilizable y fácil de testear.
- El sistema de categorías mejoró visualmente la lectura del inventario.

### Problemas identificados

- El montaje virtiofs del workspace causó desfase entre las herramientas de archivo y bash, bloqueando temporalmente la escritura de `InventoryScreen.js`. Se resolvió escribiendo directamente vía Python en el mount.
- La validación de formularios estaba ausente, permitiendo guardar productos sin nombre o con fechas inválidas.
- Los errores de red de Supabase se mostraban como mensajes técnicos en inglés, sin orientación para el usuario.

### Acciones de mejora para Sprint 3

- Agregar pruebas manuales sistemáticas antes de cada entrega.
- Definir criterios de aceptación por historia de usuario antes de comenzar el desarrollo.
- Priorizar notificaciones push como primera tarea del siguiente sprint.

## Roadmap

- [x] Crear estructura base de la app.
- [x] Implementar navegación principal.
- [x] Crear pantallas principales.
- [x] Implementar autenticación con Supabase.
- [x] Persistir sesión con AsyncStorage.
- [x] Crear tabla de productos en Supabase.
- [x] Guardar productos en Supabase.
- [x] Implementar escáner con Expo Camera.
- [x] Implementar inventario.
- [x] Implementar edición y eliminación de productos.
- [x] Integrar Open Food Facts para autocompletar nombre y marca al escanear.
- [x] Implementar categorías de productos con íconos y colores.
- [x] Manejo de errores de red y Supabase con mensajes en español.
- [x] Validación de formularios con feedback visual (nombre requerido, fecha, cantidad).
- [x] Ordenamiento del inventario (reciente, por vencer, A–Z).
- [ ] Implementar notificaciones push.
- [ ] Lista de compras inteligente (productos por vencer o terminados).
- [ ] Integrar OCR/IA para boletas.
- [ ] Agregar pruebas automatizadas.
- [ ] Preparar despliegue o build de entrega.

## Consideraciones de seguridad

- Las credenciales sensibles no deben subirse al repositorio.
- El archivo `.env` debe mantenerse local.
- Solo deben subirse variables de ejemplo en `.env.example`.
- La tabla `products` usa Row Level Security para restringir acceso por usuario.
- La clave pública de Supabase debe ser usada solo como clave pública/anónima del cliente.

## Limitaciones actuales

- La consulta a Open Food Facts requiere conexión a internet y puede no encontrar productos locales o poco comunes.
- El procesamiento OCR de boletas aún no está implementado.
- Las notificaciones push aún no están implementadas.
- Falta incorporar pruebas automatizadas.

## Licencia

Proyecto académico desarrollado para la asignatura Ingeniería de Software.
