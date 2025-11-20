// ============================================
// إعداد رابط Google Apps Script
// ============================================
const API_URL = "https://script.google.com/macros/s/AKfycbw2yeFfD4jc8m2CcW1YGIRrJ1s4C4UDND2bRnRO3LWPpQ0qjgB-QH5qLm0WDCgmjnDN/exec";

// ============================================
// تسجيل مستخدم جديد
// ============================================
async function registerUser(event) {
    event.preventDefault();

    const name = document.getElementById("reg_name").value.trim();
    const email = document.getElementById("reg_email").value.trim();
    const password = document.getElementById("reg_password").value.trim();

    if (!name || !email || !password) {
        alert("الرجاء تعبئة جميع الحقول");
        return;
    }

    const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "register",
            name,
            email,
            password
        }),
    });

    const result = await response.json();

    if (result.status === "ok") {
        localStorage.setItem("userName", name);
        localStorage.setItem("userEmail", email);
        window.location.href = "index.html";
    } else {
        alert(result.message);
    }
}

// ============================================
// تسجيل الدخول
// ============================================
async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("login_email").value.trim();
    const password = document.getElementById("login_password").value.trim();

    const response = await fetch(API_URL + `?action=login&email=${email}&password=${password}`);

    const result = await response.json();

    if (result.status === "ok") {
        localStorage.setItem("userName", result.name);
        localStorage.setItem("userEmail", email);
        window.location.href = "index.html";
    } else {
        alert("بيانات الدخول غير صحيحة");
    }
}

// ============================================
// تسجيل خروج
// ============================================
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

// ============================================
// جلب المنتجات من Google Sheets
// ============================================
async function loadProducts() {
    const response = await fetch(API_URL + "?action=getInventory");
    const result = await response.json();

    const container = document.getElementById("productsGrid");
    container.innerHTML = "";

    result.data.forEach((p) => {
        container.innerHTML += `
            <div class="product-card">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p>السعر: ${p.price} ريال</p>
                <p>المتبقي: ${p.qty}</p>
                <button onclick="addToCart(${p.id})">إضافة للسلة</button>
            </div>
        `;
    });
}

// ============================================
// إضافة إلى السلة
// ============================================
async function addToCart(productId) {
    const userEmail = localStorage.getItem("userEmail");

    if (!userEmail) {
        alert("يجب تسجيل الدخول أولاً");
        window.location.href = "login.html";
        return;
    }

    const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "addToCart",
            email: userEmail,
            productId: productId,
            qty: 1
        })
    });

    const result = await response.json();

    if (result.status === "ok") {
        alert("تمت الإضافة للسلة ✔");
        loadProducts();
    } else {
        alert(result.message);
    }
}

// ============================================
// تهيئة صفحة index
// ============================================
function initIndexPage() {
    const name = localStorage.getItem("userName");

    if (!name) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("welcomeUser").innerText = "مرحباً، " + name;
    loadProducts();
}
