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
npx expo start
```

Luego escanea el QR con la app **Expo Go** en tu celular.

## Estructura

```
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

## Próximos pasos (Sprint 2+)
- [ ] Integrar `expo-camera` para escáner real
- [ ] Vista de Inventario completa
- [ ] Backend / base de datos (Neon o MongoDB)
- [ ] Autenticación Login/Register (Patricio)
