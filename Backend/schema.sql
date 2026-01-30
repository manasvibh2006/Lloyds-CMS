-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create floors table
CREATE TABLE IF NOT EXISTS floors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  building_id INT NOT NULL,
  floor_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  floor_id INT NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (floor_id) REFERENCES floors(id)
);

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  bed_number INT NOT NULL,
  status VARCHAR(50) DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  bed_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bed_id) REFERENCES beds(id)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample buildings
INSERT IGNORE INTO buildings (id, name, address) VALUES 
(1, 'Building A', '123 Main Street'),
(2, 'Building B', '456 Oak Avenue'),
(3, 'Building C', '789 Pine Road');
