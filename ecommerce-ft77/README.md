# SpiderShop · Tienda en línea

**URL de producción:** [https://ecommerce-ft77-blush.vercel.app](https://ecommerce-ft77-blush.vercel.app)

## Descripción del proyecto

SpiderShop es una tienda en línea desarrollada como proyecto integrador. Permite:

- Explorar productos, buscar por nombre y filtrar por categoría.
- Ver detalles de productos y agregarlos al carrito.
- Registrarse e iniciar sesión con correo y contraseña, o con Google.
- Confirmar compras y consultar el historial y estado de las órdenes propias.
- Administrar productos, imágenes, inventario y estados de órdenes desde un panel exclusivo para administradores.

Los productos y órdenes se guardan en Cloud Firestore. Las imágenes de productos se almacenan en Amazon S3. El checkout registra la orden, pero no procesa pagos reales.

## Decisiones arquitectónicas

El código está organizado por responsabilidades:

- **`pages`** — pantallas de tienda, autenticación, compras y administración.
- **`components`** — elementos reutilizables de interfaz.
- **`contexts` y `reducers`** — sesión, tema y estado del carrito.
- **`hooks`** — lógica reutilizable, como la búsqueda con debounce.
- **`services`** — acceso a Firestore, datos demo y carga de imágenes.
- **`routes`** — rutas y protección del panel de administración.
- **`types`** — tipos compartidos de usuarios, productos, carrito y órdenes.
- **`api`** — función de Vercel que autoriza y firma cargas de imágenes a S3.

Algunas decisiones puntuales:

- El carrito usa Context y reducer, y persiste en el navegador con `localStorage`.
- Los perfiles nuevos reciben el rol `customer`. El rol `admin` se asigna desde un entorno confiable.
- Las reglas de Firestore restringen el acceso a órdenes, productos y perfiles según el usuario y su rol.
- Las credenciales de AWS se usan solo en el servidor. El navegador recibe una URL temporal firmada para cargar imágenes a S3.

## Instrucciones de instalación

Requisitos: Node.js y npm.

```bash
git clone https://github.com/ValentinaLeyvaCR/ProyectoM5Front_ValentinaLeyva.git
cd ProyectoM5Front_ValentinaLeyva/ecommerce-ft77
npm install
```

Para iniciar el frontend:

```bash
npm run dev
```

Para probar localmente también la función de carga de imágenes, inicia sesión en Vercel y ejecuta:

```bash
npm install -g vercel
npm run dev:vercel
```

## Comandos disponibles

```bash
npm run lint
npm run test:run
npm run test:coverage
npm run build
```

La integración continua ejecuta lint, pruebas con cobertura y compilación al subir cambios a GitHub o abrir un pull request hacia `main`.

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores desde Firebase y AWS. Configura las variables correspondientes también en Vercel. **No subas `.env`, `.env.local` ni credenciales reales al repositorio.**

| Variable | Uso / origen |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Configuración de la aplicación web en Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Configuración de la aplicación web en Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Configuración de la aplicación web en Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Configuración de la aplicación web en Firebase |
| `VITE_FIREBASE_APP_ID` | Configuración de la aplicación web en Firebase |
| `AWS_ACCESS_KEY_ID` | Credencial IAM usada solo por la función de Vercel |
| `AWS_SECRET_ACCESS_KEY` | Secreto IAM usado solo por la función de Vercel |
| `AWS_REGION` | Región del bucket S3 |
| `AWS_S3_BUCKET` | Nombre del bucket S3 |
| `AWS_S3_PUBLIC_BASE_URL` | URL base pública para mostrar las imágenes |
| `APP_ORIGIN` | Origen autorizado para la función; en producción, URL de la tienda |

Las variables `VITE_*` están disponibles en el cliente y no deben contener secretos. Las credenciales AWS no deben llevar el prefijo `VITE_`.

## Configuración de Firebase y S3

1. En Firebase Authentication, habilita Email/Password y Google y agrega el dominio de producción a los dominios autorizados.
2. Configura Firestore y publica las reglas del archivo `firestore.rules`.
3. Crea el perfil de administración en `users/{uid}` desde Firebase Console o un entorno confiable, asignándole `role: "admin"`. El registro público crea perfiles con rol `customer`.
4. En S3, configura CORS para permitir el origen de la tienda y los métodos `PUT`, `GET` y `HEAD`.
5. Agrega las variables de Firebase y AWS en el entorno local y en Vercel.

## Flujo de compra y carga de imágenes

**Compra:** el cliente agrega productos al carrito y confirma la compra. La aplicación guarda una orden pendiente en Firestore con los artículos, el total, el usuario y la fecha. En **Mis compras**, el cliente consulta su historial y estado; administración puede actualizarlo.

**Imagen de producto:** el administrador selecciona una imagen JPG, PNG o WEBP de hasta 5 MB. La función `/api/presign` verifica el token de Firebase y el rol de administrador, y solicita a S3 una URL temporal. El navegador usa esa URL para cargar la imagen y guarda su dirección junto al producto en Firestore.

## Pruebas

Las pruebas usan Vitest y React Testing Library. Cubren autenticación, rutas protegidas, catálogo, carrito y checkout, historial de órdenes, administración, Firestore y carga de imágenes. Firebase y S3 se simulan durante las pruebas.

## Credenciales de prueba

**Rol:** Administrador  
**Correo:** pruebaadminspidershop@gmail.com  
**Contraseña:** Prueba.spidershop13

## Seguridad

- Las reglas de Firestore limitan la lectura de órdenes al cliente propietario y al administrador.
- Solo administradores pueden modificar productos y actualizar órdenes.
- La función de Vercel valida token, rol, formato y tamaño de imagen antes de firmar una carga.
- Mantén `.env.local` y las credenciales reales fuera de Git.