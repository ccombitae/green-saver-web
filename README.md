# Green Saver Web

Aplicación web de Green Saver: calcula el sistema solar fotovoltaico que necesita una vivienda a partir de su
consumo y su ciudad, y permite al equipo de Green Saver gestionar clientes, cotizaciones y el análisis del recurso
solar. Es un entorno independiente de la app móvil (React Native) y consume **la misma API FastAPI**
([green-saver](https://github.com/ccombitae/green-saver)).

| | |
|---|---|
| Tecnología | React 18 + Vite 5, React Router 6, Recharts |
| Backend | API REST FastAPI (JWT + roles), PostgreSQL, modelo de ML (Gradient Boosting) |
| Pruebas | Vitest + Testing Library (14 pruebas), flujo completo con Playwright |
| Despliegue | Contenedor Docker con nginx, o sitio estático (Azure Static Web Apps) |

## Funcionalidades

**Público**
1. Página de inicio con calculadora sin registro (consumo + ciudad → paneles, potencia, ahorro, CO₂ y producción de cada mes).
2. Registro con validación de datos.
3. Inicio de sesión con JWT y renovación automática del token.
4. Recuperación de contraseña.

**Usuario**

5. Inicio con el último cálculo y el sistema instalado.
6. Calculadora con el modelo de aprendizaje automático (49 ciudades) y guardado del cálculo.
7. Historial de cálculos con paginación y detalle.
8. Mi sistema instalado.
9. Información sobre energía solar.
10. Perfil y cierre de sesión.

**Administrador**

11. Resumen con indicadores y cálculos pendientes de cotizar.
12. Gestión de usuarios: búsqueda, paginación, asignación de sistema y eliminación con confirmación.
13. Cotizaciones: selección del cálculo, materiales, precio, envío por correo y aceptación con fecha de instalación.
14. Estadísticas del negocio con gráficas.
15. Dashboard del análisis exploratorio del recurso solar y del desempeño del modelo de ML.

## Ejecutar en local

Requisitos: Node.js 20+ y la API de Green Saver corriendo (por defecto en `http://localhost:8000`).

```bash
npm install
cp .env.example .env.local      # edita VITE_API_URL si la API está en otra dirección
npm run dev                     # http://localhost:5173
```

Administrador de pruebas: `admin@greensaver.com` con la contraseña definida en la variable `ADMIN_PASSWORD` de la API.

## Pruebas

```bash
npm test                        # pruebas unitarias y de componentes (Vitest)

# Flujo completo en navegador (API + base de datos de PRUEBAS vacía)
npx playwright install chromium # solo la primera vez
npm run build && npm run preview &
npm run e2e                     # deja capturas en e2e/capturas/
```

## Despliegue

La URL de la API se fija **al compilar** con `VITE_API_URL`. En la API, agrega el dominio del sitio a `CORS_ORIGINS`.

**Contenedor Docker (Azure App Service, Google Cloud Run u otro):**

```bash
docker build --build-arg VITE_API_URL=https://URL-DE-LA-API -t green-saver-web .
docker run -p 8080:8080 green-saver-web    # http://localhost:8080
```

nginx sirve el sitio y redirige cualquier ruta a `index.html` (aplicación de una sola página).

**Azure Static Web Apps (plan gratuito):** compila con `npm run build` y publica la carpeta `dist`.
El archivo `public/staticwebapp.config.json` ya configura el redireccionamiento de rutas.

## Estructura

```
src/
├── api/          cliente HTTP (token, renovación, errores) y funciones por recurso
├── auth/         sesión (AuthContext) y protección de rutas por rol
├── components/   shell de la app, gráficas, calculadora, componentes de interfaz
├── pages/
│   ├── public/   inicio, ingresar, registro, recuperar
│   ├── user/     inicio, calculadora, historial, mi sistema, energía solar, perfil
│   └── admin/    resumen, usuarios, cotizaciones, estadísticas, recurso solar
├── styles/       sistema visual
└── __tests__/    pruebas Vitest
e2e/              prueba de punta a punta con Playwright
```

Proyecto de Gestión del Conocimiento · Ingeniería de Software · Universidad de Cundinamarca, Seccional Girardot.
