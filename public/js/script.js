document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  fetchCart();

  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sku = document.getElementById('prodSku').value;
      const item_name = document.getElementById('prodName').value;
      const category = document.getElementById('prodCategory').value;
      const price = document.getElementById('prodPrice').value;
      const stock = document.getElementById('prodStock').value;

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, item_name, category, price, stock })
      });

      if (res.ok) {
        addProductForm.reset();
        fetchProducts();
      }
    });
  }

  const clearCartBtn = document.getElementById('clearCartBtn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', async () => {
      await fetch('/api/clear-cart', { method: 'POST' });
      fetchCart();
    });
  }

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', generateInvoice);
  }
});

async function fetchProducts() {
  const tableBody = document.getElementById('productsTableBody');
  const posList = document.getElementById('posProductList');
  if (!tableBody && !posList) return;

  const res = await fetch('/api/products');
  const products = await res.json();

  if (tableBody) {
    tableBody.innerHTML = products.map(p => `
      <tr>
        <td>${p.sku || '-'}</td>
        <td>${p.item_name}</td>
        <td>${p.category || '-'}</td>
        <td>₹${parseFloat(p.price).toFixed(2)}</td>
        <td>
          <span class="badge ${p.stock > 5 ? 'badge-success' : p.stock > 0 ? 'badge-warning' : 'badge-danger'}">
            ${p.stock} in stock
          </span>
        </td>
        <td>
          <button onclick="deleteProduct(${p.id})" class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem;">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  if (posList) {
    posList.innerHTML = products.map(p => {
      const safeName = p.item_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return `
        <tr>
          <td>${p.item_name}</td>
          <td>₹${parseFloat(p.price).toFixed(2)}</td>
          <td>${p.stock}</td>
          <td>
            <button onclick="addToCart(${p.id}, '${safeName}', ${p.price})" class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" ${p.stock <= 0 ? 'disabled' : ''}>
              + Add
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

async function deleteProduct(id) {
  await fetch(`/api/products/${id}`, { method: 'DELETE' });
  fetchProducts();
}

async function addToCart(productId, itemName, price) {
  try {
    const res = await fetch('/api/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, item_name: itemName, price: price, quantity: 1 })
    });
    
    const data = await res.json();
    if (res.ok) {
      fetchCart();
    } else {
      alert("Error: " + (data.error || "Failed to add item"));
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
}

async function fetchCart() {
  const cartList = document.getElementById('posCartList');
  const subtotalEl = document.getElementById('posSubtotal');

  try {
    const res = await fetch('/api/cart');
    const data = await res.json();

    if (cartList) {
      if (data.items && data.items.length > 0) {
        cartList.innerHTML = data.items.map(item => `
          <tr>
            <td>${item.item_name}</td>
            <td>
              <input type="number" value="${item.quantity}" min="1" style="width: 50px; padding: 2px 5px;" onchange="updateCartQty(${item.id}, this.value)">
            </td>
            <td>₹${parseFloat(item.total).toFixed(2)}</td>
            <td>
              <button onclick="removeCartItem(${item.id})" class="btn btn-danger" style="padding: 2px 6px; font-size: 0.75rem;">X</button>
            </td>
          </tr>
        `).join('');
      } else {
        cartList.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Cart empty hai</td></tr>`;
      }
    }

    if (subtotalEl) {
      subtotalEl.innerText = parseFloat(data.subtotal || 0).toFixed(2);
    }
  } catch(err) {
    console.error("Fetch cart error:", err);
  }
}

async function updateCartQty(id, quantity) {
  await fetch('/api/update-cart-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, quantity })
  });
  fetchCart();
}

async function removeCartItem(id) {
  await fetch('/api/delete-cart-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  fetchCart();
}

async function generateInvoice() {
  const customerName = document.getElementById('custName').value || 'Walk-in Customer';
  const paymentMode = document.getElementById('payMode').value;
  const discount = document.getElementById('discountAmount').value || 0;

  const res = await fetch('/api/generate-bill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: customerName,
      payment_mode: paymentMode,
      discount: discount
    })
  });

  const data = await res.json();
  if (res.ok && data.bill) {
    const bill = data.bill;
    document.getElementById('invId').innerText = bill.billId;
    document.getElementById('invCust').innerText = bill.customerName;
    document.getElementById('invPay').innerText = bill.paymentMode;
    document.getElementById('invSubtotal').innerText = parseFloat(bill.subtotal).toFixed(2);
    document.getElementById('invDiscount').innerText = parseFloat(bill.discount).toFixed(2);
    document.getElementById('invGst').innerText = parseFloat(bill.gstAmount).toFixed(2);
    document.getElementById('invGrandTotal').innerText = parseFloat(bill.grandTotal).toFixed(2);

    const itemsTbody = document.getElementById('invItems');
    itemsTbody.innerHTML = bill.items.map(i => `
      <tr>
        <td>${i.item_name}</td>
        <td>₹${parseFloat(i.price).toFixed(2)}</td>
        <td>${i.quantity}</td>
        <td>₹${parseFloat(i.total).toFixed(2)}</td>
      </tr>
    `).join('');

    document.getElementById('invoiceReceipt').style.display = 'block';
  } else {
    alert(data.error || 'Cart empty hai! Pehle POS Terminal se items Add Karein.');
  }
}