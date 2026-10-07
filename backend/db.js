const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../billing.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    item_name TEXT NOT NULL,
    category TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    item_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    customer_name TEXT,
    payment_mode TEXT,
    subtotal REAL,
    discount REAL,
    gst_amount REAL,
    grand_total REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER,
    item_name TEXT,
    price REAL,
    quantity INTEGER,
    total REAL,
    FOREIGN KEY (bill_id) REFERENCES bills(id)
  )`);

  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (!err && row.count === 0) {
      console.log("Seeding default store products...");
      const stmt = db.prepare("INSERT INTO products (sku, item_name, category, price, stock) VALUES (?, ?, ?, ?, ?)");
      
      const defaultProducts = [
        ['GROC-101', 'Fortune Sunflower Oil 1L', 'Grocery', 145.00, 50],
        ['GROC-102', 'Aashirvaad Atta 5kg', 'Grocery', 230.00, 40],
        ['GROC-103', 'Tata Salt 1kg', 'Grocery', 28.00, 100],
        ['GROC-104', 'Sugar / Cheeni 1kg', 'Grocery', 45.00, 80],
        ['GROC-105', 'Basmati Rice 5kg', 'Grocery', 490.00, 25],
        ['DAIRY-201', 'Amul Taaza Milk 500ml', 'Dairy', 27.00, 60],
        ['DAIRY-202', 'Amul Butter 100g', 'Dairy', 58.00, 35],
        ['DAIRY-203', 'Amul Paneer 200g', 'Dairy', 90.00, 20],
        ['SNACK-301', 'Lays Classic Salted (Large)', 'Snacks', 20.00, 100],
        ['SNACK-302', 'Kurkure Masala Munch', 'Snacks', 20.00, 90],
        ['SNACK-303', 'Parle-G Biscuit Big Pack', 'Snacks', 25.00, 120],
        ['SNACK-304', 'Cadbury Dairy Milk Silk', 'Snacks', 175.00, 45],
        ['BEV-401', 'Coca Cola 750ml', 'Beverages', 40.00, 50],
        ['BEV-402', 'Red Bull Energy Drink', 'Beverages', 125.00, 30],
        ['BEV-403', 'Nescafe Classic Coffee 50g', 'Beverages', 185.00, 25],
        ['PERSONAL-501', 'Dove Soap 75g', 'Personal Care', 52.00, 40],
        ['PERSONAL-502', 'Colgate Total Toothpaste', 'Personal Care', 115.00, 35],
        ['PERSONAL-503', 'Head & Shoulders Shampoo', 'Personal Care', 210.00, 20],
        ['ELEC-601', 'Type-C Fast Charging Cable', 'Electronics', 199.00, 15],
        ['ELEC-602', 'Wireless Computer Mouse', 'Electronics', 499.00, 10]
      ];

      for (const prod of defaultProducts) {
        stmt.run(prod);
      }
      stmt.finalize();
      console.log("20 Default products added successfully!");
    }
  });
});

module.exports = db;