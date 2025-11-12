# 🍷 VinoVault

**Proyecto:** VinoVault: Aplicación web para gestión de stock y ventas de vinos.  
**Autor:** Vladimir De Andrade  

---

## 📝 Descripción

**VinoVault** es una aplicación **web full-stack** desarrollada con **React (Vite) + Node.js (Express)** y base de datos **PostgreSQL**, orientada a facilitar la gestión de inventario, control de ventas y registro de productos para vendedores o distribuidores de vinos.  

El sistema permite **registrar productos, controlar el stock, gestionar clientes, registrar ventas** y consultar el historial de movimientos.  
Está desarrollada íntegramente en **TypeScript**, garantizando un código más limpio, seguro y mantenible.

---

## ⚙️ Instalación y ejecución

### 🔹 1. Clonar el repositorio
```bash
git clone https://github.com/usuario/vino_stock_app.git
cd vino_stock_app
```

### 🔹 2. Instalar dependencias del frontend
```bash
cd frontend
npm install
```

### 🔹 3. Instalar dependencias del backend
```bash
cd ../backend
npm install
```

### 🔹 4. Configurar variables de entorno

Crear un archivo `.env` en la carpeta **backend** con los siguientes valores:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_contraseña
DB_NAME=vino_stock
JWT_SECRET=clave_secreta
EXCHANGE_API_KEY=tu_api_key
```

### 🔹 5. Crear la base de datos en PostgreSQL

Antes de ejecutar el backend, asegurate de crear la base de datos manualmente en PostgreSQL.  
Podés hacerlo desde **pgAdmin**, **DBeaver**, o la terminal de PostgreSQL:

```sql
-- Opcional: Elimina la base de datos si ya existe para empezar de cero
-- DROP DATABASE IF EXISTS vino_stock;

-- Creación de Tablas
CREATE TABLE public.almacenes (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    ubicacion text
);

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    ruc character varying(50),
    telefono character varying(50),
    email character varying(255),
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    es_extranjero boolean DEFAULT false
);

CREATE TABLE public.inventario (
    producto_id integer NOT NULL,
    almacen_id integer NOT NULL,
    cantidad integer DEFAULT 0 NOT NULL,
    fecha_actualizacion timestamp with time zone DEFAULT now()
);

CREATE TABLE public.movimientos_stock (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    almacen_id integer NOT NULL,
    tipo_movimiento character varying(50) NOT NULL,
    cantidad integer NOT NULL,
    fecha_movimiento timestamp with time zone DEFAULT now(),
    usuario_id integer
);

CREATE TABLE public.productos (
    id integer NOT NULL,
    sku character varying(100) NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    precio_compra numeric(10,2),
    precio_venta numeric(10,2),
    fecha_creacion timestamp with time zone DEFAULT now(),
    imagen_url character varying(255)
);

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    nombre_completo character varying(255),
    rol character varying(50) DEFAULT 'vendedor'::character varying NOT NULL,
    activo boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT now()
);

CREATE TABLE public.venta_items (
    id integer NOT NULL,
    venta_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL
);

CREATE TABLE public.ventas (
    id integer NOT NULL,
    cliente_id integer,
    usuario_id integer,
    fecha_venta timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) NOT NULL,
    estado character varying(50) DEFAULT 'Completada'::character varying,
    moneda character varying(3) DEFAULT 'USD'::character varying,
    almacen_id integer,
    subtotal numeric(10,2),
    impuesto numeric(10,2)
);

-- Creación de Secuencias (para autoincremento de IDs)
CREATE SEQUENCE public.almacenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.almacenes_id_seq OWNED BY public.almacenes.id;

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;

CREATE SEQUENCE public.movimientos_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.movimientos_stock_id_seq OWNED BY public.movimientos_stock.id;

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;

CREATE SEQUENCE public.venta_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.venta_items_id_seq OWNED BY public.venta_items.id;

CREATE SEQUENCE public.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;

-- Configuración de valores por defecto (autoincremento)
ALTER TABLE ONLY public.almacenes ALTER COLUMN id SET DEFAULT nextval('public.almacenes_id_seq'::regclass);
ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);
ALTER TABLE ONLY public.movimientos_stock ALTER COLUMN id SET DEFAULT nextval('public.movimientos_stock_id_seq'::regclass);
ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);
ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);
ALTER TABLE ONLY public.venta_items ALTER COLUMN id SET DEFAULT nextval('public.venta_items_id_seq'::regclass);
ALTER TABLE ONLY public.ventas ALTER COLUMN id SET DEFAULT nextval('public.ventas_id_seq'::regclass);

-- Configuración de Claves Primarias (PK)
ALTER TABLE ONLY public.almacenes
    ADD CONSTRAINT almacenes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (producto_id, almacen_id);
ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.venta_items
    ADD CONSTRAINT venta_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);

-- Configuración de Claves Únicas (UNIQUE)
ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_sku_key UNIQUE (sku);
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);

-- Configuración de Claves Foráneas (FK)
ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_almacen_id_fkey FOREIGN KEY (almacen_id) REFERENCES public.almacenes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_almacen_id_fkey FOREIGN KEY (almacen_id) REFERENCES public.almacenes(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.venta_items
    ADD CONSTRAINT venta_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);
ALTER TABLE ONLY public.venta_items
    ADD CONSTRAINT venta_items_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id);
ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_almacen_id_fkey FOREIGN KEY (almacen_id) REFERENCES public.almacenes(id);
ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);
ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

-- Creación de Índices
CREATE INDEX idx_productos_nombre ON public.productos USING btree (nombre);
CREATE INDEX idx_productos_sku ON public.productos USING btree (sku);

```

### 🔹 7. Iniciar el backend
```bash
npm run dev
```

### 🔹 8. Iniciar el frontend
```bash
cd ../frontend
npm run dev
```

---

## 🧩 Tecnologías y dependencias principales

### 🌐 **Frontend (React + Vite + TypeScript)**

| Categoría | Tecnología | Descripción |
|------------|-------------|--------------|
| Framework/Librería | **React** | Construcción de la interfaz y componentes dinámicos |
| Lenguaje | **TypeScript** | Tipado estático para un código más robusto |
| Estilo visual | **Material UI (MUI)** | Componentes de diseño moderno (botones, tablas, formularios) |
| Comunicación con backend | **Axios** | Peticiones HTTP hacia la API REST |
| Ruteo | **React Router DOM** | Navegación entre páginas (Login, Dashboard, Historial, etc.) |
| Estado global | **React Context API** | Manejo de usuario, tema y datos globales |
| Tokens | **jwt-decode** | Decodificación de JWT para obtener datos del usuario |
| Paquetería | **npm** | Gestión de dependencias del proyecto |

---

### ⚙️ **Backend (Node.js + Express + TypeScript)**

| Categoría | Tecnología | Descripción |
|------------|-------------|--------------|
| Entorno | **Node.js** | Ejecución del servidor |
| Framework | **Express.js** | Creación de la API REST |
| Lenguaje | **TypeScript** | Código más seguro y estructurado |
| Base de datos | **PostgreSQL** | Almacenamiento relacional de datos |
| ORM/Driver | **pg** | Conexión directa con PostgreSQL |
| Autenticación | **jsonwebtoken + bcryptjs** | JWT para sesión, bcrypt para contraseñas |
| Carga de archivos | **multer** | Subida de imágenes de productos |
| Peticiones externas | **axios** | Consultas a la API de tasas de cambio |
| Seguridad | **cors** | Control de acceso entre dominios |
| Configuración | **dotenv** | Variables de entorno |
| Paquetería | **npm** | Gestión de dependencias del backend |

---

## 🏗️ Arquitectura general del sistema

```
┌───────────────────────────┐
│     React (Vite + TS)     │
│     Material UI (MUI)     │
│  ────────────┬─────────── │
│    UI y lógica del cliente │
└──────────────┬────────────┘
               │
         Peticiones HTTP (Axios)
               │
               ▼
┌───────────────────────────┐
│  Node.js + Express (API)  │
│   Autenticación JWT, CRUD │
│   Gestión de imágenes     │
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────┐
│       PostgreSQL DB       │
│ Productos, Ventas, Stock  │
└───────────────────────────┘
```

---

## 🚀 Funcionalidades principales

- Autenticación segura con JWT.  
- Registro, edición y eliminación de productos.  
- Control dinámico del stock de vinos.  
- Registro de ventas y cálculo automático del inventario.  
- Panel de control con resumen de stock y ventas.  
- Consulta de historial de transacciones.  
- Subida de imágenes con Multer.  
- Tema claro / oscuro configurable.  
- Consultas automáticas de tasa de cambio mediante API externa.

---

## 🧠 Decisiones técnicas

- **React + Vite:** desarrollo rápido con recarga instantánea y rendimiento optimizado.  
- **TypeScript:** reducción de errores en tiempo de compilación y mejor mantenibilidad.  
- **Material UI:** diseño moderno y consistente sin necesidad de CSS manual extenso.  
- **Context API:** simplifica el manejo del estado global sin necesidad de Redux.  
- **Node.js + Express:** arquitectura ligera y rápida para la API.  
- **PostgreSQL:** base de datos relacional robusta y confiable.  
- **JWT + bcrypt:** autenticación segura y eficiente.  

---

## 🧾 Estructura de carpetas

```
vino_stock_app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   └── package.json
│
└── README.md
```

---

## 📚 Referencias

- [React Documentation](https://react.dev/)  
- [Vite Documentation](https://vitejs.dev/)  
- [Material UI](https://mui.com/)  
- [Axios](https://axios-http.com/)  
- [React Router DOM](https://reactrouter.com/)  
- [Node.js](https://nodejs.org/)  
- [Express.js](https://expressjs.com/)  
- [PostgreSQL](https://www.postgresql.org/)  
- [TypeScript](https://www.typescriptlang.org/)  
- [JWT.io](https://jwt.io/)  
