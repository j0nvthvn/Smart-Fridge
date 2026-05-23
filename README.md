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

Actualmente la aplicación cuenta con un MVP funcional que incluye:

- Inicio de sesión y registro de usuarios mediante Supabase Auth.
- Persistencia de sesión local con AsyncStorage.
- Registro manual de productos.
- Escaneo de códigos de barra y QR mediante cámara.
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
- Row Level Security, RLS
- AsyncStorage
- Expo Camera
- React Navigation

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

- Escaneo de código de barras o QR usando la cámara del dispositivo.
- Ingreso manual de producto mediante formulario.

Los productos registrados se almacenan en Supabase asociados al usuario autenticado.

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
        - Escaneo de códigos de barra / QR
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
| AsyncStorage | React Native AsyncStorage | Persistencia local de sesión y datos legacy |
| Cámara del dispositivo | Expo Camera | Lectura de códigos de barra y QR |
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
    │   └── colors.js
    ├── context/
    │   ├── AuthContext.js
    │   └── InventoryContext.js
    ├── screens/
    │   ├── HomeScreen.js
    │   ├── InventoryScreen.js
    │   ├── ScannerScreen.js
    │   ├── SettingsScreen.js
    │   ├── LoginScreen.js
    │   └── RegisterScreen.js
    └── services/
        └── supabase.js
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

## Sprint 1 — Avance

Durante el Sprint 1 se logró construir la base funcional de la aplicación:

- Estructura inicial del proyecto.
- Navegación principal por pestañas.
- Pantallas principales de la app.
- Registro e inicio de sesión con Supabase.
- Integración inicial con base de datos.
- Registro de productos.
- Escáner con cámara.
- Inventario persistente.
- Alertas de vencimiento.
- CRUD básico de productos.

## Sprint 2 — Próximos pasos

Para el Sprint 2 se propone avanzar en:

- Integración de OCR o IA para lectura de boletas.
- Mejoras en la experiencia de usuario del inventario.
- Notificaciones push para productos próximos a vencer.
- Mejoras en validación de formularios.
- Mejor manejo de errores de red y Supabase.
- Documentación más completa de instalación y configuración.
- Pruebas manuales de los flujos principales.
- Preparación de demo estable para presentación.

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
- [ ] Integrar OCR/IA para boletas.
- [ ] Implementar notificaciones push.
- [ ] Agregar pruebas.
- [ ] Mejorar documentación técnica.
- [ ] Preparar despliegue o build de entrega.

## Consideraciones de seguridad

- Las credenciales sensibles no deben subirse al repositorio.
- El archivo `.env` debe mantenerse local.
- Solo deben subirse variables de ejemplo en `.env.example`.
- La tabla `products` usa Row Level Security para restringir acceso por usuario.
- La clave pública de Supabase debe ser usada solo como clave pública/anónima del cliente.

## Limitaciones actuales

- El procesamiento OCR de boletas aún no está implementado.
- Las notificaciones push aún no están implementadas.
- La app todavía está en etapa MVP.
- La clasificación automática de productos todavía debe ser definida.
- Falta incorporar pruebas automatizadas.

## Licencia

Proyecto académico desarrollado para la asignatura Ingeniería de Software.
