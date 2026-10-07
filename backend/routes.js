const express = require('express');
const router = express.Router();
const billing = require('./billing');
const products = require('./products');
const customers = require('./customers');

router.get('/products', (req, res) => {
  products.getProducts((err, items) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(items);
  });
});

router.post('/products', (req, res) => {
  const { sku, item_name, category, price, stock } = req.body;
  products.addProduct(sku, item_name, category, parseFloat(price), parseInt(stock), (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product added successfully", data: result });
  });
});

router.delete('/products/:id', (req, res) => {
  products.deleteProduct(parseInt(req.params.id), (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product deleted" });
  });
});

router.post('/add-to-cart', (req, res) => {
  const { product_id, item_name, price, quantity } = req.body;
  if (!item_name || price === undefined) {
    return res.status(400).json({ error: "Item name and price are required" });
  }
  
  billing.addToCart(
    product_id || null, 
    item_name, 
    parseFloat(price) || 0, 
    parseInt(quantity) || 1, 
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Item added to cart", data: result });
    }
  );
});

router.get('/cart', (req, res) => {
  billing.getCart((err, items) => {
    if (err) return res.status(500).json({ error: err.message });
    const subtotal = (items || []).reduce((sum, item) => sum + (item.total || 0), 0);
    res.json({ items: items || [], subtotal });
  });
});

router.post('/update-cart-item', (req, res) => {
  const { id, quantity } = req.body;
  billing.updateCartItem(parseInt(id), parseInt(quantity), (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Cart updated" });
  });
});

router.post('/delete-cart-item', (req, res) => {
  const { id } = req.body;
  billing.deleteCartItem(parseInt(id), (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Cart item removed" });
  });
});

router.post('/clear-cart', (req, res) => {
  billing.clearCart((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Cart cleared" });
  });
});

router.post('/generate-bill', (req, res) => {
  const { customer_id, customer_name, payment_mode, discount } = req.body;
  billing.generateBill(customer_id, customer_name, payment_mode, discount, (err, bill) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: "Bill generated successfully", bill });
  });
});

module.exports = router;