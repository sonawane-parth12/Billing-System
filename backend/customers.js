const db = require('./db');

const addCustomer = (name, phone, email, callback) => {
  const sql = `INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)`;
  db.run(sql, [name, phone, email], function(err) {
    callback(err, { id: this ? this.lastID : null, name, phone, email });
  });
};

const getCustomers = (callback) => {
  const sql = `SELECT * FROM customers ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    callback(err, rows);
  });
};

module.exports = {
  addCustomer,
  getCustomers
};