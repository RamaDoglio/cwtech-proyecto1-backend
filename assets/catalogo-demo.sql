-- Catalogo demo para MySQL 8.0.
-- Importar luego de ejecutar las migraciones. Es seguro ejecutarlo mas de una vez:
-- solo agrega lineas, marcas y productos que no esten activos.
-- Los importes son referenciales para una demo, no precios de mercado.
-- Requiere que exista el usuario con id 1.

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO linea (denominacion, observacion, utilizaStockMinimo, stockMinimo, sistema)
SELECT datos.denominacion, datos.observacion, datos.utilizaStockMinimo, datos.stockMinimo, 0
FROM (
  SELECT 'ACEITES' AS denominacion, 'Aceites comestibles' AS observacion, 1 AS utilizaStockMinimo, 12 AS stockMinimo
  UNION ALL SELECT 'AZUCAR Y ENDULZANTES', 'Azucares y endulzantes', 1, 12
  UNION ALL SELECT 'CONSERVAS', 'Vegetales, pescados y frutas en conserva', 1, 8
  UNION ALL SELECT 'HARINAS Y REBOZADORES', 'Harinas, premezclas y rebozadores', 1, 10
  UNION ALL SELECT 'PASTAS SECAS', 'Pastas secas y fideos', 1, 12
  UNION ALL SELECT 'GALLETITAS', 'Galletitas dulces y saladas', 1, 12
  UNION ALL SELECT 'CHOCOLATES Y GOLOSINAS', 'Chocolates, alfajores y caramelos', 1, 12
  UNION ALL SELECT 'INFUSIONES', 'Yerba, te y cafe', 1, 8
  UNION ALL SELECT 'LACTEOS UHT', 'Leches larga vida y crema UHT', 1, 8
  UNION ALL SELECT 'SALSAS Y ADEREZOS', 'Salsas, mayonesas y condimentos', 1, 10
  UNION ALL SELECT 'LEGUMBRES Y ARROZ', 'Arroz, lentejas, porotos y garbanzos', 1, 10
) AS datos
WHERE NOT EXISTS (
  SELECT 1 FROM linea l WHERE l.denominacion = datos.denominacion AND l.deletedAt IS NULL
);

INSERT INTO marca (denominacion, observacion, sistema)
SELECT datos.denominacion, 'Marca comercial usada en el catalogo demo', 0
FROM (
  SELECT 'ARCOR' AS denominacion UNION ALL SELECT 'CABANAS'
  UNION ALL SELECT 'CACHAMAI' UNION ALL SELECT 'CANUELAS'
  UNION ALL SELECT 'CAROYENSE' UNION ALL SELECT 'CIRCE'
  UNION ALL SELECT 'DON VITTORIO' UNION ALL SELECT 'KNORR'
  UNION ALL SELECT 'LA CAMPAGNOLA' UNION ALL SELECT 'LA VIRGINIA'
  UNION ALL SELECT 'LA SERENISIMA' UNION ALL SELECT 'LEDESMA'
  UNION ALL SELECT 'LUCCCHETTI' UNION ALL SELECT 'MOLINOS'
  UNION ALL SELECT 'NESTLE' UNION ALL SELECT 'NATURA'
  UNION ALL SELECT 'PLAYADITO' UNION ALL SELECT 'SANCOR'
  UNION ALL SELECT 'TERRABUSI'
) AS datos
WHERE NOT EXISTS (
  SELECT 1 FROM marca m WHERE m.denominacion = datos.denominacion AND m.deletedAt IS NULL
);

CREATE TEMPORARY TABLE catalogo_demo_producto (
  codigo VARCHAR(20) NOT NULL,
  denominacion VARCHAR(255) NOT NULL,
  linea VARCHAR(255) NOT NULL,
  marca VARCHAR(255) NOT NULL,
  costo DECIMAL(15,5) NOT NULL,
  stock DECIMAL(12,3) NOT NULL,
  stock_minimo DECIMAL(12,3) NOT NULL,
  ubicacion VARCHAR(50) NOT NULL
);

INSERT INTO catalogo_demo_producto
  (codigo, denominacion, linea, marca, costo, stock, stock_minimo, ubicacion)
VALUES
  ('DEMO-001', 'Aceite de girasol Natura 900 ml', 'ACEITES', 'NATURA', 1800, 48, 12, 'A-01'),
  ('DEMO-002', 'Aceite de girasol Natura 1.5 l', 'ACEITES', 'NATURA', 2850, 36, 12, 'A-01'),
  ('DEMO-003', 'Aceite mezcla Natura 900 ml', 'ACEITES', 'NATURA', 1550, 42, 12, 'A-01'),
  ('DEMO-004', 'Aceite de oliva Natura clasico 500 ml', 'ACEITES', 'NATURA', 5200, 18, 6, 'A-02'),
  ('DEMO-005', 'Aceite de girasol Cocinero 900 ml', 'ACEITES', 'MOLINOS', 1750, 40, 12, 'A-02'),
  ('DEMO-006', 'Azucar blanca Ledesma 1 kg', 'AZUCAR Y ENDULZANTES', 'LEDESMA', 1150, 60, 15, 'B-01'),
  ('DEMO-007', 'Azucar rubia Ledesma 500 g', 'AZUCAR Y ENDULZANTES', 'LEDESMA', 1200, 24, 8, 'B-01'),
  ('DEMO-008', 'Azucar impalpable Cañuelas 500 g', 'AZUCAR Y ENDULZANTES', 'CANUELAS', 900, 30, 10, 'B-02'),
  ('DEMO-009', 'Edulcorante liquido Hileret 200 ml', 'AZUCAR Y ENDULZANTES', 'MOLINOS', 1350, 18, 6, 'B-02'),
  ('DEMO-010', 'Edulcorante sobres Hileret 100 unidades', 'AZUCAR Y ENDULZANTES', 'MOLINOS', 2100, 16, 5, 'B-02'),
  ('DEMO-011', 'Choclo amarillo La Campagnola 300 g', 'CONSERVAS', 'LA CAMPAGNOLA', 1600, 28, 8, 'C-01'),
  ('DEMO-012', 'Arvejas La Campagnola 300 g', 'CONSERVAS', 'LA CAMPAGNOLA', 1450, 30, 8, 'C-01'),
  ('DEMO-013', 'Jardinera La Campagnola 300 g', 'CONSERVAS', 'LA CAMPAGNOLA', 1700, 24, 8, 'C-01'),
  ('DEMO-014', 'Tomate perita La Campagnola 400 g', 'CONSERVAS', 'LA CAMPAGNOLA', 1250, 36, 10, 'C-02'),
  ('DEMO-015', 'Atun al natural La Campagnola 170 g', 'CONSERVAS', 'LA CAMPAGNOLA', 2600, 20, 6, 'C-02'),
  ('DEMO-016', 'Harina 0000 Blancaflor 1 kg', 'HARINAS Y REBOZADORES', 'MOLINOS', 1050, 50, 12, 'D-01'),
  ('DEMO-017', 'Harina 000 Blancaflor 1 kg', 'HARINAS Y REBOZADORES', 'MOLINOS', 1050, 50, 12, 'D-01'),
  ('DEMO-018', 'Harina leudante Blancaflor 1 kg', 'HARINAS Y REBOZADORES', 'MOLINOS', 1250, 36, 10, 'D-01'),
  ('DEMO-019', 'Rebozador Preferido 500 g', 'HARINAS Y REBOZADORES', 'MOLINOS', 980, 28, 8, 'D-02'),
  ('DEMO-020', 'Polenta instantanea Mamasol 500 g', 'HARINAS Y REBOZADORES', 'MOLINOS', 850, 30, 10, 'D-02'),
  ('DEMO-021', 'Fideos tirabuzon Lucchetti 500 g', 'PASTAS SECAS', 'LUCCCHETTI', 950, 48, 12, 'E-01'),
  ('DEMO-022', 'Fideos mostachol Lucchetti 500 g', 'PASTAS SECAS', 'LUCCCHETTI', 950, 48, 12, 'E-01'),
  ('DEMO-023', 'Fideos spaghetti Lucchetti 500 g', 'PASTAS SECAS', 'LUCCCHETTI', 900, 48, 12, 'E-01'),
  ('DEMO-024', 'Fideos cabello de angel Lucchetti 500 g', 'PASTAS SECAS', 'LUCCCHETTI', 980, 30, 10, 'E-02'),
  ('DEMO-025', 'Fideos moñito Don Vittorio 500 g', 'PASTAS SECAS', 'DON VITTORIO', 1100, 36, 12, 'E-02'),
  ('DEMO-026', 'Fideos penne rigate Don Vittorio 500 g', 'PASTAS SECAS', 'DON VITTORIO', 1100, 36, 12, 'E-02'),
  ('DEMO-027', 'Fideos spaghetti Don Vittorio 500 g', 'PASTAS SECAS', 'DON VITTORIO', 1050, 36, 12, 'E-03'),
  ('DEMO-028', 'Fideos nido Don Vittorio 500 g', 'PASTAS SECAS', 'DON VITTORIO', 1250, 24, 8, 'E-03'),
  ('DEMO-029', 'Galletitas Chocolinas 250 g', 'GALLETITAS', 'TERRABUSI', 1300, 30, 10, 'F-01'),
  ('DEMO-030', 'Galletitas Diversion 400 g', 'GALLETITAS', 'TERRABUSI', 1800, 24, 8, 'F-01'),
  ('DEMO-031', 'Galletitas Lincoln 153 g', 'GALLETITAS', 'TERRABUSI', 900, 36, 12, 'F-01'),
  ('DEMO-032', 'Galletitas Variedad Terrabusi 390 g', 'GALLETITAS', 'TERRABUSI', 2100, 20, 8, 'F-02'),
  ('DEMO-033', 'Galletitas Oreo original 117 g', 'GALLETITAS', 'TERRABUSI', 1150, 30, 10, 'F-02'),
  ('DEMO-034', 'Galletitas Chocolinas 170 g', 'GALLETITAS', 'TERRABUSI', 980, 36, 12, 'F-02'),
  ('DEMO-035', 'Galletitas Salmas original 144 g', 'GALLETITAS', 'TERRABUSI', 1150, 24, 8, 'F-03'),
  ('DEMO-036', 'Chocolate Aguila taza clasico 150 g', 'CHOCOLATES Y GOLOSINAS', 'ARCOR', 1850, 24, 8, 'G-01'),
  ('DEMO-037', 'Chocolate Aguila semiamargo 150 g', 'CHOCOLATES Y GOLOSINAS', 'ARCOR', 1950, 24, 8, 'G-01'),
  ('DEMO-038', 'Chocolate Cofler leche 55 g', 'CHOCOLATES Y GOLOSINAS', 'ARCOR', 900, 40, 12, 'G-01'),
  ('DEMO-039', 'Chocolate Cofler block 110 g', 'CHOCOLATES Y GOLOSINAS', 'ARCOR', 1500, 30, 10, 'G-02'),
  ('DEMO-040', 'Alfajor Bon o Bon simple 30 g', 'CHOCOLATES Y GOLOSINAS', 'ARCOR', 500, 60, 20, 'G-02'),
  ('DEMO-041', 'Caramelos Sugus frutales 150 g', 'CHOCOLATES Y GOLOSINAS', 'ARCOR', 750, 36, 12, 'G-02'),
  ('DEMO-042', 'Chocolate Shot 35 g', 'CHOCOLATES Y GOLOSINAS', 'ARCOR', 550, 48, 15, 'G-03'),
  ('DEMO-043', 'Yerba mate Playadito 1 kg', 'INFUSIONES', 'PLAYADITO', 4200, 36, 10, 'H-01'),
  ('DEMO-044', 'Yerba mate Playadito 500 g', 'INFUSIONES', 'PLAYADITO', 2300, 36, 12, 'H-01'),
  ('DEMO-045', 'Yerba mate Cachamai tradicional 500 g', 'INFUSIONES', 'CACHAMAI', 1950, 30, 10, 'H-01'),
  ('DEMO-046', 'Yerba mate Cachamai hierbas serranas 500 g', 'INFUSIONES', 'CACHAMAI', 2100, 24, 8, 'H-02'),
  ('DEMO-047', 'Te La Virginia saquitos 25 unidades', 'INFUSIONES', 'LA VIRGINIA', 1100, 30, 10, 'H-02'),
  ('DEMO-048', 'Te La Virginia limon saquitos 25 unidades', 'INFUSIONES', 'LA VIRGINIA', 1150, 24, 8, 'H-02'),
  ('DEMO-049', 'Cafe instantaneo Nescafe clasico 170 g', 'INFUSIONES', 'NESTLE', 5200, 18, 6, 'H-03'),
  ('DEMO-050', 'Cafe Dolca suave 170 g', 'INFUSIONES', 'NESTLE', 3900, 18, 6, 'H-03'),
  ('DEMO-051', 'Leche entera La Serenisima 1 l', 'LACTEOS UHT', 'LA SERENISIMA', 1450, 48, 12, 'I-01'),
  ('DEMO-052', 'Leche descremada La Serenisima 1 l', 'LACTEOS UHT', 'LA SERENISIMA', 1450, 42, 12, 'I-01'),
  ('DEMO-053', 'Leche chocolatada La Serenisima 1 l', 'LACTEOS UHT', 'LA SERENISIMA', 1850, 30, 10, 'I-01'),
  ('DEMO-054', 'Leche entera Sancor 1 l', 'LACTEOS UHT', 'SANCOR', 1400, 42, 12, 'I-02'),
  ('DEMO-055', 'Leche descremada Sancor 1 l', 'LACTEOS UHT', 'SANCOR', 1400, 36, 12, 'I-02'),
  ('DEMO-056', 'Crema de leche La Serenisima 200 ml', 'LACTEOS UHT', 'LA SERENISIMA', 1250, 24, 8, 'I-02'),
  ('DEMO-057', 'Pure de tomate Knorr 520 g', 'SALSAS Y ADEREZOS', 'KNORR', 1200, 36, 10, 'J-01'),
  ('DEMO-058', 'Sopa crema de calabaza Knorr 68 g', 'SALSAS Y ADEREZOS', 'KNORR', 850, 24, 8, 'J-01'),
  ('DEMO-059', 'Caldo de verduras Knorr 114 g', 'SALSAS Y ADEREZOS', 'KNORR', 900, 30, 10, 'J-01'),
  ('DEMO-060', 'Mayonesa Natura clasica 500 g', 'SALSAS Y ADEREZOS', 'NATURA', 1650, 24, 8, 'J-02'),
  ('DEMO-061', 'Mayonesa Natura clasica 250 g', 'SALSAS Y ADEREZOS', 'NATURA', 950, 30, 10, 'J-02'),
  ('DEMO-062', 'Ketchup Natura 500 g', 'SALSAS Y ADEREZOS', 'NATURA', 1300, 24, 8, 'J-02'),
  ('DEMO-063', 'Mostaza Natura 250 g', 'SALSAS Y ADEREZOS', 'NATURA', 850, 24, 8, 'J-03'),
  ('DEMO-064', 'Salsa lista filetto La Campagnola 340 g', 'SALSAS Y ADEREZOS', 'LA CAMPAGNOLA', 1150, 30, 10, 'J-03'),
  ('DEMO-065', 'Salsa lista portuguesa La Campagnola 340 g', 'SALSAS Y ADEREZOS', 'LA CAMPAGNOLA', 1150, 30, 10, 'J-03'),
  ('DEMO-066', 'Arroz largo fino Lucchetti 1 kg', 'LEGUMBRES Y ARROZ', 'LUCCCHETTI', 1350, 42, 12, 'K-01'),
  ('DEMO-067', 'Arroz parboil Lucchetti 1 kg', 'LEGUMBRES Y ARROZ', 'LUCCCHETTI', 1550, 30, 10, 'K-01'),
  ('DEMO-068', 'Arroz integral Lucchetti 500 g', 'LEGUMBRES Y ARROZ', 'LUCCCHETTI', 1450, 24, 8, 'K-01'),
  ('DEMO-069', 'Lentejas Cabañas 400 g', 'LEGUMBRES Y ARROZ', 'CABANAS', 1200, 30, 10, 'K-02'),
  ('DEMO-070', 'Garbanzos Cabañas 400 g', 'LEGUMBRES Y ARROZ', 'CABANAS', 1300, 24, 8, 'K-02'),
  ('DEMO-071', 'Porotos alubia Cabañas 400 g', 'LEGUMBRES Y ARROZ', 'CABANAS', 1350, 24, 8, 'K-02'),
  ('DEMO-072', 'Porotos colorados Cabañas 400 g', 'LEGUMBRES Y ARROZ', 'CABANAS', 1400, 20, 8, 'K-03'),
  ('DEMO-073', 'Aceitunas verdes Caroyense 180 g', 'CONSERVAS', 'CAROYENSE', 1600, 24, 8, 'C-03'),
  ('DEMO-074', 'Aceitunas negras Caroyense 180 g', 'CONSERVAS', 'CAROYENSE', 1700, 24, 8, 'C-03'),
  ('DEMO-075', 'Aceitunas verdes descarozadas Caroyense 180 g', 'CONSERVAS', 'CAROYENSE', 1750, 20, 6, 'C-03'),
  ('DEMO-076', 'Aceitunas verdes Caroyense 500 g', 'CONSERVAS', 'CAROYENSE', 3300, 16, 5, 'C-04'),
  ('DEMO-077', 'Aceite de oliva Caroyense 250 ml', 'ACEITES', 'CAROYENSE', 3600, 18, 6, 'A-03'),
  ('DEMO-078', 'Aceite de oliva Caroyense 500 ml', 'ACEITES', 'CAROYENSE', 6100, 12, 4, 'A-03'),
  ('DEMO-079', 'Vinagre de alcohol Circe 500 ml', 'SALSAS Y ADEREZOS', 'CIRCE', 700, 30, 10, 'J-04'),
  ('DEMO-080', 'Vinagre de manzana Circe 500 ml', 'SALSAS Y ADEREZOS', 'CIRCE', 900, 24, 8, 'J-04'),
  ('DEMO-081', 'Vinagre balsamico Circe 250 ml', 'SALSAS Y ADEREZOS', 'CIRCE', 1550, 18, 6, 'J-04'),
  ('DEMO-082', 'Aceto balsamico Circe 250 ml', 'SALSAS Y ADEREZOS', 'CIRCE', 1700, 18, 6, 'J-05'),
  ('DEMO-083', 'Arroz largo fino Molinos Ala 1 kg', 'LEGUMBRES Y ARROZ', 'MOLINOS', 1300, 36, 12, 'K-04'),
  ('DEMO-084', 'Arroz doble Carolina Molinos Ala 1 kg', 'LEGUMBRES Y ARROZ', 'MOLINOS', 1450, 30, 10, 'K-04'),
  ('DEMO-085', 'Arroz yamaní Molinos Ala 500 g', 'LEGUMBRES Y ARROZ', 'MOLINOS', 1500, 20, 8, 'K-04'),
  ('DEMO-086', 'Galletitas surtidas Arcor 400 g', 'GALLETITAS', 'ARCOR', 1900, 24, 8, 'F-04'),
  ('DEMO-087', 'Galletitas Sonrisas 118 g', 'GALLETITAS', 'ARCOR', 850, 36, 12, 'F-04'),
  ('DEMO-088', 'Galletitas Merengadas 118 g', 'GALLETITAS', 'ARCOR', 850, 36, 12, 'F-04'),
  ('DEMO-089', 'Dulce de leche Nestle 400 g', 'CHOCOLATES Y GOLOSINAS', 'NESTLE', 1800, 20, 8, 'G-04'),
  ('DEMO-090', 'Cacao Nesquik 180 g', 'CHOCOLATES Y GOLOSINAS', 'NESTLE', 2200, 24, 8, 'G-04'),
  ('DEMO-091', 'Cereal Nesquik 330 g', 'CHOCOLATES Y GOLOSINAS', 'NESTLE', 3400, 16, 5, 'G-04'),
  ('DEMO-092', 'Fideos tirabuzon Matarazzo 500 g', 'PASTAS SECAS', 'MOLINOS', 950, 36, 12, 'E-04'),
  ('DEMO-093', 'Fideos spaghetti Matarazzo 500 g', 'PASTAS SECAS', 'MOLINOS', 900, 36, 12, 'E-04'),
  ('DEMO-094', 'Fideos mostachol Matarazzo 500 g', 'PASTAS SECAS', 'MOLINOS', 950, 30, 10, 'E-04'),
  ('DEMO-095', 'Harina de maiz Cañuelas 500 g', 'HARINAS Y REBOZADORES', 'CANUELAS', 850, 30, 10, 'D-03'),
  ('DEMO-096', 'Harina para pizza Cañuelas 1 kg', 'HARINAS Y REBOZADORES', 'CANUELAS', 1200, 30, 10, 'D-03'),
  ('DEMO-097', 'Premezcla bizcochuelo vainilla Exquisita 540 g', 'HARINAS Y REBOZADORES', 'MOLINOS', 2400, 18, 6, 'D-03'),
  ('DEMO-098', 'Premezcla brownie Exquisita 480 g', 'HARINAS Y REBOZADORES', 'MOLINOS', 2600, 18, 6, 'D-04'),
  ('DEMO-099', 'Te verde Cachamai saquitos 25 unidades', 'INFUSIONES', 'CACHAMAI', 1200, 20, 8, 'H-04'),
  ('DEMO-100', 'Mate cocido Cachamai saquitos 25 unidades', 'INFUSIONES', 'CACHAMAI', 950, 24, 8, 'H-04');

INSERT INTO producto (
  denominacion, codigoProveedor, alicuotaIva, stock, utilizaStockMinimo,
  utilizaStockMinimoPorEmpresa, stockMinimo, costo, precio, porcentaje,
  fechaCosto, costoEnDolar, destacado, envioGratis, ubicacion, sistema,
  codigoReferencia, usuario_created_id, linea_id, marca_id, utilizaPack
)
SELECT
  datos.denominacion,
  datos.codigo,
  21.00,
  datos.stock,
  1,
  0,
  datos.stock_minimo,
  datos.costo,
  ROUND(datos.costo * 1.15, 5),
  15.00,
  CURRENT_TIMESTAMP,
  0,
  0,
  0,
  datos.ubicacion,
  0,
  datos.codigo,
  1,
  linea.id,
  marca.id,
  0
FROM catalogo_demo_producto datos
INNER JOIN linea ON linea.denominacion = datos.linea AND linea.deletedAt IS NULL
INNER JOIN marca ON marca.denominacion = datos.marca AND marca.deletedAt IS NULL
LEFT JOIN producto existente
  ON existente.denominacion = datos.denominacion AND existente.deletedAt IS NULL
WHERE existente.id IS NULL;

DROP TEMPORARY TABLE catalogo_demo_producto;
COMMIT;
