// رابط API ثابت
const API_URL = "https://script.google.com/macros/s/AKfycbw2yeFfD4jc8m2CcW1YGIRrJ1s4C4UDND2bRnRO3LWPpQ0qjgB-QH5qLm0WDCgmjnDN/exec";


// ========== تسجيل مستخدم ==========
function handleRegister() {
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    let url = `${API_URL}?action=register&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

    let res = await fetch(url);
    let data = await res.json();

    alert(data.message);

    if (data.success) {

      // تخزين بيانات المستخدم مباشرة بعد التسجيل
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        name: name,
        email: email
      }));

      // تحويل مباشر إلى المنتجات
      window.location.href = "index.html";
    }
  });
}


// ========== تسجيل الدخول ==========
function handleLogin() {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    let url = `${API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

    let res = await fetch(url);
    let data = await res.json();

    if (!data.success) return alert("خطأ في تسجيل الدخول");

    // تخزين بيانات المستخدم
    localStorage.setItem("user", JSON.stringify(data));

    alert("تم تسجيل الدخول");
    window.location.href = "index.html";
  });
}



// ========== حماية الصفحات ==========
function requireLogin() {
  let user = localStorage.getItem("user");
  if (!user) {
    window.location.href = "login.html";
  }
}



// ========== جلب المنتجات ==========
async function loadInventory() {

  // حماية الصفحة
  requireLogin();

  let url = `${API_URL}?action=getInventory`;

  let res = await fetch(url);
  let data = await res.json();

  if (!data.success) return;

  let list = document.getElementById("product-list");

  list.innerHTML = data.items
    .map(
      (item) => `
      <div class="product">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p>السعر: ${item.price}</p>
        <p>الكمية: <span id="qty-${item.id}">${item.qty}</span></p>
        <button onclick="addToCart(${item.id})">إضافة للسلة</button>
      </div>
    `
    )
    .join("");
}



// ========== إضافة للسلة + تحديث الكمية ==========
async function addToCart(productId) {

  let user = JSON.parse(localStorage.getItem("user"));
  if (!user) return alert("سجّل دخولك أولاً");

  let qty = 1;

  let url = `${API_URL}?action=addToCart&email=${encodeURIComponent(
    user.email
  )}&productId=${productId}&qty=${qty}`;

  let res = await fetch(url);
  let data = await res.json();

  alert(data.message);

  if (data.success) {
    document.getElementById(`qty-${productId}`).textContent = data.newQty;
  }
}



// ========== السلة ==========
function renderCart() {
  requireLogin();

  let box = document.getElementById("cart-items");

  box.innerHTML = `
    <p>السلة تُسجَّل مباشرة عبر Google Sheets.</p>
    <p>أي عملية شراء محفوظة داخل CartLog.</p>
  `;
}

