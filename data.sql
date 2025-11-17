INSERT INTO roles(name) VALUES ('jefe');
INSERT INTO roles(name) VALUES ('administrador');
INSERT INTO roles(name) VALUES ('mozo');
INSERT INTO roles(name) VALUES ('cocinero');
INSERT INTO roles(name) VALUES ('cajero');

INSERT INTO staffs(name, password, dni, rol_id, active) VALUE ('Juan Perez', '$2a$10$4jjG.2p6YihIO6fJvRBIhu/c/MkktCruhtUxiuFzT1.iU78i26xBK', '00000000', 1, true);
INSERT INTO staffs(name, password, dni, rol_id, active) VALUE ('Maria Gomez', '$2a$10$4jjG.2p6YihIO6fJvRBIhu/c/MkktCruhtUxiuFzT1.iU78i26xBK', '00000001', 2, true);
INSERT INTO staffs(name, password, dni, rol_id, active) VALUE ('Carlos Lopez', '$2a$10$4jjG.2p6YihIO6fJvRBIhu/c/MkktCruhtUxiuFzT1.iU78i26xBK', '00000010', 3, true);
INSERT INTO staffs(name, password, dni, rol_id, active) VALUE ('Ana Martinez', '$2a$10$4jjG.2p6YihIO6fJvRBIhu/c/MkktCruhtUxiuFzT1.iU78i26xBK', '00000011', 4, true);
INSERT INTO staffs(name, password, dni, rol_id, active) VALUE ('Luis Rodriguez', '$2a$10$4jjG.2p6YihIO6fJvRBIhu/c/MkktCruhtUxiuFzT1.iU78i26xBK', '00000100', 5, true);

INSERT INTO categories (name) VALUES ('Plato de carta');
INSERT INTO categories (name) VALUES ('Menu');
INSERT INTO categories (name) VALUES ('Bebida');
INSERT INTO categories (name) VALUES ('Promoción');

INSERT INTO subcategories (name, category_id) VALUES ('Entrada', 2);
INSERT INTO subcategories (name, category_id) VALUES ('Fondo', 2);
INSERT INTO subcategories (name, category_id) VALUES ('Ceviche', 2);

INSERT INTO subcategories (name, category_id) VALUES ('Cerveza', 3);
INSERT INTO subcategories (name, category_id) VALUES ('Gaseosa', 3);
INSERT INTO subcategories (name, category_id) VALUES ('Natural', 3);

INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Lomo saltado', 'Lomo saltado con papas fritas y arroz', 25.00, 1, NULL, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Ceviche', 'Ceviche de pescado con camote y choclo', 20.00, 2, 3, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Arroz con mariscos', 'Arroz con mariscos frescos y especias', 28.00, 1, NULL, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Pollo a la brasa', 'Pollo a la brasa con papas y ensalada', 32.00, 1, NULL, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Menu Entrada: Ensalada rusa', 'Ensalada rusa como entrada del menú', 10.00, 2, 1, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Menu Fondo: Seco de carne', 'Seco de carne con arroz y frijoles', 18.00, 2, 2, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Cerveza artesanal', 'Cerveza artesanal local', 12.00, 3, 4, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Gaseosa cola', 'Gaseosa cola fría', 6.00, 3, 5, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Jugo natural de naranja', 'Jugo natural recién exprimido', 8.00, 3, 6, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Promo 2x1 Lomo saltado', 'Promoción especial de lomo saltado', 40.00, 4, NULL, true);
INSERT INTO plates (name, description, price, category_id, subcategory_id, active) VALUES ('Promo bebida gratis', 'Promoción de bebida gratis con menú', 0.00, 4, NULL, true);

INSERT INTO tables (number, status) VALUES (1, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (2, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (3, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (4, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (5, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (6, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (7, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (8, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (9, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (10, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (11, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (12, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (13, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (14, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (15, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (16, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (17, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (18, 'DISPONIBLE');
INSERT INTO tables (number, status) VALUES (19, 'DISPONIBLE');