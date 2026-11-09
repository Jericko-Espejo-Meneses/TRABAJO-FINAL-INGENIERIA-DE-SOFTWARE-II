-- 1. Tablas Independientes
CREATE TABLE administrador (
    id_admin SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(20)
);

-- 2. Tablas de Primer Nivel de Dependencia
CREATE TABLE restaurante (
    id_restaurante SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200) NOT NULL,
    tipo_comida VARCHAR(100),
    id_admin INT,
    FOREIGN KEY (id_admin) REFERENCES administrador(id_admin)
);

CREATE TABLE donacion (
    id_donacion SERIAL PRIMARY KEY,
    monto DECIMAL(10,2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE notificacion (
    id_notificacion SERIAL PRIMARY KEY,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50),
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE carrito (
    id_carrito SERIAL PRIMARY KEY,
    total DECIMAL(10,2) DEFAULT 0.00,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- 3. Tablas de Segundo Nivel de Dependencia
CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(50),
    stock INT DEFAULT 0,
    id_restaurante INT NOT NULL,
    FOREIGN KEY (id_restaurante) REFERENCES restaurante(id_restaurante)
);

-- Tabla intermedia para la relación N a N entre Carrito y Producto
CREATE TABLE carrito_producto (
    id_carrito INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT DEFAULT 1,
    PRIMARY KEY (id_carrito, id_producto),
    FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito),
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    id_usuario INT NOT NULL,
    id_carrito INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito)
);

-- 4. Tablas de Tercer Nivel de Dependencia
CREATE TABLE pago (
    id_pago SERIAL PRIMARY KEY,
    metodo_pago VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    id_pedido INT UNIQUE NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
);