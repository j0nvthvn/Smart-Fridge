# SmartFridge

App móvil para gestión de alimentos del refrigerador.
Proyecto: Ingeniería de Software — Grupo 4, Sección Jordan Barría Pineda.

## Vistas del Sprint 1

- **Home**: resumen de productos, alertas de vencimiento, lista de compras
- **Escáner**: escáner de código de barras + ingreso manual
- **Cuenta**: perfil, notificaciones, preferencias

## Requisitos

- Node.js 18+
- Expo CLI

## Instalación

```bash
npm install
cp .env.example .env
npx expo start
```

Luego escanea el QR con la app **Expo Go** en tu celular.

## Estructura

```text
SmartFridge/
├── App.js                  # Navegación principal (Tab Navigator)
├── src/
│   ├── screens/            # Pantallas principales
│   │   ├── HomeScreen.js       # Vista inicio con alertas
│   │   ├── ScannerScreen.js    # Escáner y registro manual
│   │   ├── SettingsScreen.js   # Perfil y preferencias
│   │   ├── LoginScreen.js      # Autenticación
│   │   └── RegisterScreen.js   # Registro
│   ├── components/         # Componentes reutilizables
│   │   ├── SectionHeader.js
│   │   └── SettingsRow.js
│   ├── context/            # Estado global (React Context)
│   │   └── AuthContext.js
│   ├── constants/          # Constantes de la app
│   │   └── colors.js       # Paleta de colores (verde/blanco)
│   ├── hooks/              # Custom hooks (lógica compartida)
│   ├── services/           # Servicios (API, autenticación, storage)
│   ├── utils/              # Funciones helper y datos mock
│   └── types/              # Tipos TypeScript (si aplica)
└── package.json
```

## Paleta de colores

- Verde principal: `#2CA456`
- Verde oscuro: `#1E7A3F`
- Fondo: `#F8F9FA`

## Backend (Supabase)

La app usa [Supabase](https://supabase.com) para autenticación y base de datos.

- **Auth**: Login y Registro con email/contraseña (`supabase.auth`)
- **BD**: Tabla `profiles` con nombre de usuario (creación automática vía trigger)
- **Inventario**: Tabla `products` protegida por RLS por usuario
- **Sesión**: Persistida localmente con `AsyncStorage`

Configura estas variables antes de iniciar Expo:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Para crear la tabla de inventario, ejecuta en el SQL Editor de Supabase:

```sql
-- ver supabase/products.sql
```

## Próximos pasos (Sprint 2+)

- [x] Integrar `expo-camera` para escáner real
- [ ] Vista de Inventario completa
- [x] Guardar productos en Supabase
- [ ] CRUD completo de productos en Supabase
- [ ] Notificaciones push de vencimiento
