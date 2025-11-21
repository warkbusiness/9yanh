// رابط API
const API_URL =
  "https://script.google.com/macros/s/AKfycbw2yeFfD4jc8m2CcW1YGIRrJ1s4C4UDND2bRnRO3LWPpQ0qjgB-QH5qLm0WDCgmjnDN/exec";


// ========== تسجيل الخروج ==========
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ========== حماية الصفحات ==========
function requireLogin() {
  let user = localStorage.getItem("user");
  if (!user) {
    window.location.href = "login.html";
  }
}



// =============================
//      تسجيل حساب جديد
// =============================
function handleRegister() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    let url = `${API_URL}?action=register&name=${encodeURIComponent(
      name
    )}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(
      password
    )}`;

    let res = await fetch(url);
    let data = await res.json();

    alert(data.message);

    if (data.success) {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: data.id, name, email })
      );
      window.location.href = "index.html";
    }
  });
}



// =============================
//        تسجيل الدخول
// =============================
function handleLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    let url = `${API_URL}?action=login&email=${encodeURIComponent(
      email
    )}&password=${encodeURIComponent(password)}`;

    let res = await fetch(url);
    let data = await res.json();

    if (!data.success) {
      alert("خطأ في تسجيل الدخول");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));
    alert("تم تسجيل الدخول");
    window.location.href = "index.html";
  });
}



// =============================
//     عرض المنتجات
// =============================
async function loadInventory() {
  requireLogin();

  let list = document.getElementById("product-list");
  if (!list) return;

  let url = `${API_URL}?action=getInventory`;
  let res = await fetch(url);
  let data = await res.json();

  if (!data.success) {
    list.innerHTML = "<p>حدث خطأ في تحميل المنتجات</p>";
    return;
  }

  list.innerHTML = data.items
    .map(
      (item) => `
      <div class="product">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p>السعر: <strong>${item.price} ريال</strong></p>
        <p>الكمية المتاحة: <span id="qty-${item.id}">${item.qty}</span></p>
        <button onclick="addToCart(${item.id})">إضافة إلى السلة</button>
      </div>
    `
    )
    .join("");
}



// =============================
//        إضافة للسلة
// =============================
async function addToCart(productId) {
  let user = JSON.parse(localStorage.getItem("user"));
  if (!user) return alert("سجّل دخولك أولاً");

  let qty = 1;

  let url = `${API_URL}?action=addToCart&email=${encodeURIComponent(
    user.email
  )}&productId=${productId}&qty=${qty}`;

  let res = await fetch(url);
  let data = await res.json();

  if (!data.success) {
    alert(data.message || "تعذّرت إضافة المنتج إلى السلة");
    return;
  }

  alert(data.message);

  const qtyEl = document.getElementById(`qty-${productId}`);
  if (qtyEl && typeof data.inventoryQty !== "undefined") {
    qtyEl.textContent = data.inventoryQty;
  }
}



// =============================
//     تحميل السلة وعرضها
// =============================
async function loadCart() {
  requireLogin();

  let box = document.getElementById("cart-container");
  if (!box) return;

  let user = JSON.parse(localStorage.getItem("user"));

  let url = `${API_URL}?action=getUserCart&email=${encodeURIComponent(
    user.email
  )}`;

  let res = await fetch(url);
  let data = await res.json();

  if (!data.success || data.items.length === 0) {
    box.innerHTML = `<p style="text-align:center;">السلة فارغة</p>`;
    return;
  }

  let items = data.items;
  let total = 0;

  let html = `
  <table class="cart-table">
    <tr>
      <th>المنتج</th>
      <th>السعر</th>
      <th>الكمية (+ / -)</th>
      <th>الإجمالي</th>
    </tr>
  `;

  items.forEach((item) => {
    total += item.total;

    html += `
      <tr class="cart-item-row"
          id="row-${item.productId}"
          data-product-id="${item.productId}"
          data-price="${item.price}">
        <td>${item.name}</td>
        <td>${item.price}</td>

        <td class="qty-box">
          <button class="qty-btn" onclick="changeQty(${item.productId}, 'dec')">−</button>
          <span class="qty-number" id="cart-qty-${item.productId}">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.productId}, 'inc')">+</button>
        </td>

        <td id="cart-total-${item.productId}">${item.total}</td>
      </tr>
    `;
  });

  html += `
      <tr class="total-row">
        <td colspan="3">المجموع الكلي</td>
        <td id="cart-grand-total">${total}</td>
      </tr>
    </table>
  `;

  box.innerHTML = html;
}



// =============================
//    تغيير الكمية (+ / -)
// =============================
async function changeQty(productId, direction) {
  let user = JSON.parse(localStorage.getItem("user"));
  if (!user) return alert("سجّل دخولك أولاً");

  let url = `${API_URL}?action=changeCartQty&email=${encodeURIComponent(
    user.email
  )}&productId=${productId}&direction=${direction}`;

  let res = await fetch(url);
  let data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل تحديث الكمية");
    return;
  }

  if (data.removed) {
    const row = document.getElementById(`row-${productId}`);
    if (row) row.remove();
    recalculateCartTotal();
    return;
  }

  const qtySpan = document.getElementById(`cart-qty-${productId}`);
  const row = document.getElementById(`row-${productId}`);

  if (qtySpan && row) {
    qtySpan.textContent = data.cartQty;

    const price = Number(row.dataset.price);
    const newLineTotal = price * data.cartQty;

    const totalCell = document.getElementById(`cart-total-${productId}`);
    if (totalCell) totalCell.textContent = newLineTotal;
  }

  recalculateCartTotal();
}



// =============================
//  إعادة حساب إجمالي السلة
// =============================
function recalculateCartTotal() {
  let rows = document.querySelectorAll("tr.cart-item-row");
  let total = 0;

  rows.forEach((row) => {
    const price = Number(row.dataset.price);
    const productId = row.dataset.productId;
    const qtyEl = document.getElementById(`cart-qty-${productId}`);
    const qty = qtyEl ? Number(qtyEl.textContent || "0") : 0;
    total += price * qty;
  });

  const grand = document.getElementById("cart-grand-total");
  if (grand) grand.textContent = total;
}
