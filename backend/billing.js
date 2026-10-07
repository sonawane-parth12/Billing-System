const db = require('./db');

function addToCart(productId, itemName, price, quantity, callback) {
  const total = price * quantity;
  db.get('SELECT * FROM cart WHERE item_name = ?', [itemName], (err, row) => {
    if (err) return callback(err);
    if (row) {
      const newQty = row.quantity + quantity;
      const newTotal = price * newQty;
      db.run('UPDATE cart SET quantity = ?, total = ? WHERE id = ?', [newQty, newTotal, row.id], function(err) {
        callback(err, { id: row.id, quantity: newQty, total: newTotal });
      });
    } else {
      db.run('INSERT INTO cart (product_id, item_name, price, quantity, total) VALUES (?, ?, ?, ?, ?)',
        [productId, itemName, price, quantity, total], function(err) {
          callback(err, { id: this.lastID, product_id: productId, item_name: itemName, price, quantity, total });
        });
    }
  });
}

function getCart(callback) {
  db.all('SELECT * FROM cart', [], callback);
}

function updateCartItem(id, quantity, callback) {
  db.get('SELECT price FROM cart WHERE id = ?', [id], (err, row) => {
    if (err || !row) return callback(err || new Error('Item not found'));
    const total = row.price * quantity;
    db.run('UPDATE cart SET quantity = ?, total = ? WHERE id = ?', [quantity, total, id], callback);
  });
}

function deleteCartItem(id, callback) {
  db.run('DELETE FROM cart WHERE id = ?', [id], callback);
}

function clearCart(callback) {
  db.run('DELETE FROM cart', [], callback);
}

function generateBill(customerId, customerName, paymentMode, discountAmount, callback) {
  getCart((err, cartItems) => {
    if (err) return callback(err);
    if (!cartItems || cartItems.length === 0) return callback(new Error('Cart is empty'));

    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const discount = parseFloat(discountAmount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const gstAmount = taxableAmount * 0.18;
    const grandTotal = taxableAmount + gstAmount;

    db.run(
      `INSERT INTO bills (customer_id, customer_name, payment_mode, subtotal, discount, gst_amount, grand_total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId || null, customerName || 'Walk-in Customer', paymentMode || 'Cash', subtotal, discount, gstAmount, grandTotal],
      function(err) {
        if (err) return callback(err);
        const billId = this.lastID;

        const stmt = db.prepare('INSERT INTO bill_items (bill_id, item_name, price, quantity, total) VALUES (?, ?, ?, ?, ?)');
        cartItems.forEach(item => {
          stmt.run([billId, item.item_name, item.price, item.quantity, item.total]);
          if (item.product_id) {
            db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
          }
        });
        stmt.finalize();

        clearCart((clearErr) => {
          if (clearErr) console.error('Error clearing cart:', clearErr);
          callback(null, {
            billId,
            customerName: customerName || 'Walk-in Customer',
            paymentMode: paymentMode || 'Cash',
            subtotal,
            discount,
            gstAmount,
            grandTotal,
            items: cartItems
          });
        });
      }
    );
  });
}

function getBillHistory(callback) {
  db.all('SELECT * FROM bills ORDER BY created_at DESC', [], callback);
}

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
  generateBill,
  getBillHistory
};