const db = require('./db');

const addProduct = (sku, itemName, category, price, stock, callback) => {
  const sql = `INSERT INTO products (sku, item_name, category, price, stock) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [sku, itemName, category, price, stock], function(err) {
    callback(err, { id: this ? this.lastID : null, sku, itemName, category, price, stock });
  });
};

const getProducts = (callback) => {
  const sql = `SELECT * FROM products ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    callback(err, rows);
  });
};

const updateProduct = (id, sku, itemName, category, price, stock, callback) => {
  const sql = `UPDATE products SET sku = ?, item_name = ?, category = ?, price = ?, stock = ? WHERE id = ?`;
  db.run(sql, [sku, itemName, category, price, stock, id], function(err) {
    callback(err);
  });
};

const deleteProduct = (id, callback) => {
  const sql = `DELETE FROM products WHERE id = ?`;
  db.run(sql, [id], function(err) {
    callback(err);
  });
};

module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
};