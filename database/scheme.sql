CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  company VARCHAR(100),
  role ENUM('SUPER_ADMIN','CAMP_ADMIN','CONTRACTOR'),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE buildings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50)
);

CREATE TABLE floors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT,
  name VARCHAR(20),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  floor_id INT,
  room_number VARCHAR(10),
  FOREIGN KEY (floor_id) REFERENCES floors(id)
);

CREATE TABLE beds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT,
  bunk_number INT,
  position ENUM('L','U'),
  status ENUM('AVAILABLE','PENDING','BOOKED') DEFAULT 'AVAILABLE',
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  bed_id INT,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (bed_id) REFERENCES beds(id)
);
