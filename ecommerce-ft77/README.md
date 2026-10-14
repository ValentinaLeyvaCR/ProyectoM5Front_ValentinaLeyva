# SpiderShop · Proyecto Integrador 5

SPA de comercio electrónico para Patagonix Tech. El proyecto está en construcción: esta primera etapa entrega un catálogo responsivo y un flujo de carrito/checkout local para validar la experiencia antes de conectar los servicios administrados.

## Estado actual

| Área | Estado |
| --- | --- |
| Catálogo responsive, categorías y búsqueda con debounce | Lee productos de Firestore; usa datos locales solo en modo demo/pruebas |
| Detalle de producto, stock y carrito con Context + `useReducer` | Implementado; carrito persiste en `localStorage` |
| Checkout simulado | Usuarios autenticados crean órdenes en Firestore; sin Firebase usa modo demo local |
| CRUD de productos y estados de órdenes | Panel admin guarda cambios en Firestore; requiere un perfil `admin` |
| Firebase Auth (correo/contraseña y Google), registro y logout | Código y proveedores configurados en Firebase |
| Rol `customer` por defecto y perfil en `users/{uid}` | Perfil se crea en Firestore al iniciar sesión/registrarse; reglas publicadas |
| Ruta de administración protegida por rol | `/admin` espera el perfil y exige rol `admin`; las reglas restringen operaciones |
| Historial de órdenes del cliente | Pendiente de interfaz; las órdenes ya se guardan en Firestore |
| Carrito persistido por usuario en Firestore | Pendiente; hoy persiste localmente en el navegador |
| Upload S3 por presigned URL | Pendiente; no hay credenciales AWS en el frontend |
| Vitest y React Testing Library | Configurados; pruebas del reducer, hook de carrito y flujo de checkout |
| Vercel/GitHub y URL de producción | Pendiente de conectar las cuentas y configurar el proyecto |

La aplicación todavía no está lista para producción: el carrito sigue en `localStorage`, faltan el historial de órdenes del cliente y el upload S3, y la conexión en vivo con Firebase debe validarse usando una cuenta real.

## Stack objetivo

- React 18, TypeScript y Vite
- React Router, Tailwind CSS y Context API
- Firebase Authentication y Cloud Firestore
- Vercel Functions con AWS SDK para emitir presigned URLs de S3
- Vitest y React Testing Library
- Vercel y GitHub para despliegue continuo

## Ejecutar la demo local

Requisitos actuales: Node.js y npm.

```bash
npm install
npm run dev
```

Comandos disponibles:

```bash
npm run build
npm run lint
```

## Estructura actual

```text
src/
├── components/     # common, layouts y ui
├── contexts/       # carrito, tema y AppProviders
├── hooks/          # Hooks reutilizables, como useDebounce
├── pages/          # Tienda, autenticación y panel de administración
├── routes/         # Rutas y protección de administración
├── services/       # Datos demo y acceso a Firestore
├── styles/         # globals.css y theme.css
├── test/           # Setup, fixtures y pruebas
└── types/          # Tipos de producto, carrito y órdenes
```

La ruta `/admin` tiene una guarda de frontend basada en el perfil. Las reglas publicadas en Firestore también verifican el rol para las operaciones sobre productos y órdenes. La función `api/` de presigned URLs y la integración de imágenes con S3 aún están pendientes.

## Decisiones arquitectónicas

- **Context + reducer para el carrito:** agregar, cambiar cantidades, retirar y limpiar son transiciones relacionadas; un reducer centraliza esas reglas y se puede probar sin renderizar componentes. El contexto se mantiene separado de autenticación.
- **Tipos de dominio explícitos:** `Product`, `CartItem` y `Order` distinguen los datos del catálogo, el estado de compra y el historial.
- **Debounce en la búsqueda:** se espera a que la persona deje de escribir antes de filtrar; en la versión conectada, el mismo límite evitará consultas a Firestore por cada tecla.
- **S3 detrás de una función serverless:** la función de Vercel firmará solicitudes de carga. Las llaves de AWS deben ser variables privadas del servidor (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, región y bucket) y nunca llevar prefijo `VITE_`.
- **Seguridad por doble capa:** las rutas admin pueden mejorar la experiencia, pero los permisos deben verificarse también con reglas de Firestore y funciones serverless.

## Configuración de servicios

1. En el proyecto Firebase existente, registrar una app web desde Configuración del proyecto → Tus apps → Web (`</>`). No es necesario habilitar Analytics para esta SPA.
2. En Authentication → Sign-in method, habilitar Email/Password y Google (ya están habilitados en este proyecto).
3. En Firestore Database, crear la base de datos en modo producción y elegir una región cercana a los usuarios (la base y las reglas de este proyecto ya están configuradas).
4. Copiar la configuración web de Firebase a `.env.local` (creado a partir de `.env.example`). Los valores `VITE_*` identifican el proyecto y son visibles en el cliente; no son secretos.
5. Publicar `firestore.rules`. Los perfiles nuevos quedan como `customer`; el rol `admin` se asigna desde un entorno confiable, nunca desde el formulario público.
6. Configurar `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` y `AWS_S3_PUBLIC_BASE_URL` como variables privadas de Vercel. No introducirlas en variables `VITE_*`.
7. Restringir el bucket y configurar CORS para el dominio de Vercel antes de probar cargas; luego conectar GitHub/Vercel y verificar con cuentas customer/admin separadas.

### Flujo de imagen previsto

El panel admin pedirá a `/api/upload-url` una URL firmada con nombre/tipo del archivo. La función validará autenticación y rol admin, creará una presigned URL temporal de S3 y devolverá la URL y la dirección del objeto. El navegador subirá el archivo directamente a S3 con `PUT`; el frontend guardará en Firestore la URL pública o el identificador del objeto. La función no envía las credenciales AWS al navegador.

## Variables de entorno

Ver `.env.example`. No subir `.env`, `.env.local` ni archivos con valores reales. Las variables `VITE_FIREBASE_*` identifican el proyecto Firebase y son visibles en el cliente; la seguridad se aplica mediante reglas de Firestore. Las credenciales AWS son solo del servidor.

## Pruebas

Ejecutar `npm run test:run` para correr las pruebas una vez o `npm run test` para modo interactivo. Se cubren las reglas principales del reducer, el hook `useCart` y el flujo de agregar al carrito y confirmar el checkout simulado. Las integraciones Firebase y S3 se probarán cuando se implementen, con servicios externos mockeados.

## Bitácora de uso de IA

Este registro resume el trabajo real de esta sesión. Las preguntas se describen como preguntas de trabajo, no como transcripciones literales de prompts.

| Momento | Pregunta trabajada con IA | Aprendizaje / decisión aplicada |
| --- | --- | --- |
| Planificación | ¿Qué corte vertical permite validar primero la experiencia central sin aparentar que ya hay backend? | Separar catálogo, carrito y checkout local. README declara expresamente que el almacenamiento del navegador es demostrativo. |
| Arquitectura | ¿Qué acciones relacionadas conviene centralizar y qué tipos necesita el dominio? | Se separó el reducer del contexto y se definieron `Product`, `CartItem` y `Order`; auth deberá ser otro contexto. |
| Revisión de reglas | ¿Qué casos borde rompen el carrito con existencias finitas? | Se topan cantidades al stock, una cantidad menor a uno retira el producto y limpiar devuelve un estado vacío. Falta convertir estos casos en pruebas automatizadas. |
| Resolución de problema | ¿Por qué ESLint rechazaba exportaciones del mismo archivo del contexto? | Se separaron reducer, provider, tipos y hook para seguir la estructura de referencia y mantener responsabilidades claras. |
| Testing | ¿Qué casos mínimos validan el carrito y el checkout? | Se agregaron pruebas del reducer, el hook `useCart` y el flujo simulado; cinco pruebas pasan con Vitest. |
| Firebase | ¿Cómo evitar asignar el rol admin desde el registro público? | Los perfiles se crean como `customer`; la ruta `/admin` requiere perfil `admin` y las reglas deben reforzar el mismo permiso en Firestore. |
| Validación de entorno | ¿Se incorporó el stack requerido? | Se instalaron React 18, Firebase, React Router, AWS SDK, Vitest y Testing Library; build, lint y tests pasan. |

Al avanzar cada etapa, reemplazar estos resúmenes por prompts literales y resultados concretos (incluidos desacuerdos o cambios de criterio), además de anotar la generación y ejecución de tests.

## Presentación y despliegue

No hay una URL pública todavía. No se debe presentar la demo local como una compra real ni como un sistema con roles. La demostración completa requiere primero conectar Firebase, reglas, AWS, Vercel y cuentas customer/admin.
