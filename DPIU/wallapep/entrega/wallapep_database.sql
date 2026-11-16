-- Base de datos de Wallapep con datos limpios y completos
-- Todos los usuarios tienen la contraseña 123456 (guardada en md5, como hace el backend)
-- Usuario de pruebas principal: prueba@wallapep.com / 123456

/*!40101 SET NAMES utf8mb4 */;
SET FOREIGN_KEY_CHECKS=0;

DROP DATABASE IF EXISTS `products`;
CREATE DATABASE `products` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `products`;

CREATE TABLE `users` (
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `surname` varchar(50) DEFAULT NULL,
  `documentIdentity` varchar(50) DEFAULT NULL,
  `documentNumber` varchar(50) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `address` varchar(50) DEFAULT NULL,
  `postalCode` varchar(50) DEFAULT NULL,
  `birthday` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `products` (
  `title` varchar(50) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `date` bigint(20) NOT NULL DEFAULT 0,
  `description` longtext DEFAULT NULL,
  `buyerId` bigint(20) DEFAULT NULL,
  `sellerId` bigint(20) DEFAULT NULL,
  `price` float DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `buyer` (`buyerId`),
  KEY `seller` (`sellerId`),
  CONSTRAINT `buyer` FOREIGN KEY (`buyerId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `seller` FOREIGN KEY (`sellerId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `creditcards` (
  `userId` bigint(20) DEFAULT NULL,
  `number` varchar(50) DEFAULT NULL,
  `expirationDate` bigint(20) DEFAULT NULL,
  `code` int(11) DEFAULT NULL,
  `alias` varchar(50) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  KEY `FK_creditcarts_users` (`userId`),
  CONSTRAINT `FK_creditcarts_users` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `transactions` (
  `buyerId` bigint(20) DEFAULT NULL,
  `sellerId` bigint(20) DEFAULT NULL,
  `buyerCountry` varchar(50) DEFAULT NULL,
  `buyerAddress` varchar(50) DEFAULT NULL,
  `buyerPostCode` int(11) DEFAULT NULL,
  `productId` bigint(20) DEFAULT NULL,
  `productPrice` int(11) DEFAULT NULL,
  `buyerPaymentId` bigint(20) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `startDate` bigint(20) DEFAULT NULL,
  `endDate` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_transactions_users_2` (`sellerId`),
  KEY `FK_transactions_products` (`productId`),
  KEY `FK_transactions_users` (`buyerId`),
  KEY `FK_transactions_creditcards` (`buyerPaymentId`),
  CONSTRAINT `FK_transactions_products` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_transactions_users` FOREIGN KEY (`buyerId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_transactions_users_2` FOREIGN KEY (`sellerId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (id, email, password, name, surname, documentIdentity, documentNumber, country, address, postalCode, birthday) VALUES
  (1, 'ana.garcia@wallapep.com', 'e10adc3949ba59abbe56e057f20f883e', 'Ana', 'García Pérez', 'DNI', '71234567Z', 'Spain', 'Calle Uría 10, 3ºA', '33003', 794966400000),
  (2, 'carlos.lopez@wallapep.com', 'e10adc3949ba59abbe56e057f20f883e', 'Carlos', 'López Díaz', 'DNI', '10987654X', 'Spain', 'Avenida de la Costa 45', '33205', 585792000000),
  (3, 'lucia.martinez@wallapep.com', 'e10adc3949ba59abbe56e057f20f883e', 'Lucía', 'Martínez Ruiz', 'NIE', 'X1234567L', 'Spain', 'Calle Mayor 3, 1ºB', '28013', 941500800000),
  (4, 'david.fernandez@wallapep.com', 'e10adc3949ba59abbe56e057f20f883e', 'David', 'Fernández Gil', 'Passport', 'PAA123456', 'Portugal', 'Rua Augusta 120', '1100053', 695692800000),
  (5, 'prueba@wallapep.com', 'e10adc3949ba59abbe56e057f20f883e', 'Sergio', 'Prueba Wallapep', 'DNI', '53123456K', 'Spain', 'Calle Valdés Salas 11', '33007', 1020902400000);

INSERT INTO `products` (id, sellerId, title, description, price, category, date, buyerId) VALUES
  (1, 1, 'Nintendo Switch OLED', 'Nintendo Switch OLED model, white, with two Joy-Con, dock and charger. Barely used, perfect condition.', 230, 'consola', 1790928900000, NULL),
  (2, 2, 'PlayStation 4 Slim 1TB', 'PS4 Slim 1TB with one DualShock controller and HDMI cable. Works perfectly.', 140, 'consola', 1791131400000, NULL),
  (3, 3, 'Xbox Series S', 'Xbox Series S 512GB, original box, controller included. Bought one year ago.', 190, 'consola', 1791280800000, NULL),
  (4, 4, 'Retro Game Boy Color', 'Yellow Game Boy Color with Pokemon Gold cartridge. Screen without scratches.', 85, 'consola', 1791531900000, 5),
  (5, 5, 'iPhone 12 128GB', 'iPhone 12 128GB black, battery health 86%, with case and screen protector.', 320, 'electronica', 1791051000000, NULL),
  (6, 1, 'Sony WH-1000XM4 headphones', 'Wireless noise cancelling headphones, black, with carrying case and cable.', 150, 'electronica', 1791382800000, NULL),
  (7, 2, 'Lenovo IdeaPad 15" laptop', 'Intel i5, 8GB RAM, 512GB SSD, Windows 11. Ideal for students.', 380, 'electronica', 1791709500000, NULL),
  (8, 3, 'Kindle Paperwhite', 'Kindle Paperwhite 8GB, waterproof, with light. Includes cover.', 70, 'electronica', 1791960600000, NULL),
  (9, 4, 'Levi''s denim jacket', 'Classic blue denim jacket, size M, hardly worn.', 35, 'ropa', 1791200400000, 1),
  (10, 5, 'North Face winter coat', 'Black North Face coat, size L, very warm, perfect for winter.', 90, 'ropa', 1791825900000, NULL),
  (11, 1, 'Nike Air Force 1', 'White Nike Air Force 1 sneakers, size 41, used a few times.', 55, 'ropa', 1792076400000, NULL),
  (12, 2, 'IKEA Billy bookcase', 'White Billy bookcase 80x28x202 cm, disassembled, pick up in Gijon.', 30, 'hogar', 1791448200000, 3),
  (13, 3, 'De''Longhi coffee machine', 'Espresso coffee machine with milk frother, recently descaled.', 60, 'hogar', 1792134600000, 2),
  (14, 4, 'Oak dining table', 'Solid oak table 160x90 cm, seats 6 people. Small marks on one corner.', 180, 'hogar', 1792330500000, NULL),
  (15, 5, 'Road bike Orbea Avant', 'Orbea Avant road bike, size 54, Shimano Tiagra groupset, recently serviced.', 650, 'deportes', 1791629100000, NULL),
  (16, 1, 'Adjustable dumbbells 2x20kg', 'Pair of adjustable dumbbells up to 20 kg each, with case.', 75, 'deportes', 1792425900000, NULL),
  (17, 2, 'Babolat tennis racket', 'Babolat Pure Drive racket, grip 2, with new strings and cover.', 80, 'deportes', 1792576500000, NULL),
  (18, 3, 'Harry Potter complete saga', 'The seven Harry Potter books in Spanish, paperback, good condition.', 45, 'libros', 1791894000000, NULL),
  (19, 4, 'Lot of programming books', 'Programming books in English (Perl, Java, web...), good condition. Sold together.', 20, 'libros', 1792483200000, 5),
  (20, 5, 'Dune - Frank Herbert', 'Dune hardcover special edition, perfect condition.', 18, 'libros', 1792696500000, NULL),
  (21, 1, 'Monstera deliciosa plant', 'Big Monstera plant (80 cm) with ceramic pot. Easy to care.', 25, 'planta', 1792222200000, NULL),
  (22, 3, 'Set of 3 succulents', 'Three small succulents with white pots, ideal for a desk.', 12, 'planta', 1792752000000, NULL),
  (23, 2, 'Logitech wireless mouse', 'Logitech M196 wireless mouse, grey, with USB receiver. **Works perfectly**, batteries included.\n- Includes USB receiver\n- Includes 1 AA battery', 12, 'electronica', 1792838400000, NULL);

INSERT INTO `transactions` (id, buyerId, sellerId, buyerCountry, buyerAddress, buyerPostCode, productId, productPrice, buyerPaymentId, startDate, endDate) VALUES
  (1, 5, 4, 'Spain', 'Calle Valdés Salas 11', 33007, 4, 85, NULL, 1792945800000, NULL),
  (2, 1, 4, 'Spain', 'Calle Uría 10, 3ºA', 33003, 9, 35, NULL, 1793005200000, NULL),
  (3, 3, 2, 'Spain', 'Calle Mayor 3, 1ºB', 28013, 12, 30, NULL, 1793213100000, NULL),
  (4, 5, 4, 'Spain', 'Calle Valdés Salas 11', 33007, 19, 20, NULL, 1793618100000, NULL),
  (5, 2, 3, 'Spain', 'Avenida de la Costa 45', 33205, 13, 60, NULL, 1793866800000, NULL);

SET FOREIGN_KEY_CHECKS=1;
