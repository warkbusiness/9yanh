const API_URL = "https://script.google.com/macros/s/AKfycbw2yeFfD4jc8m2CcW1YGIRrJ1s4C4UDND2bRnRO3LWPpQ0qjgB-QH5qLm0WDCgmjnDN/exec";

// === تسجيل مستخدم جديد ===
async function registerUser(event) {
    event.preventDefault();
    console.log("registerUser called");

    const name = document.getElementById("reg_name").value.trim();
    const email = document.getElementById("reg_email").value.trim();
    const password = document.getElementById("reg_password").value.trim();

    if (!name || !email || !password) {
        alert("رجاءً عبّئ كل الحقول");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "register",
                name,
                email,
                password,
            }),
        });

        const result = await response.json();
        console.log("register result:", result);

        if (result.status === "ok") {
            localStorage.setItem("userName", result.name);
            localStorage.setItem("userEmail", result.email);
            alert("تم التسجيل بنجاح");
            window.location.href = "index.html";
        } else if (result.message === "EMAIL_EXISTS") {
            alert("هذا البريد مسجّل مسبقاً");
        } else {
            alert("خطأ في التسجيل: " + (result.message || "غير معروف"));
        }
    } catch (err) {
        console.error(err);
        alert("فشل الاتصال بالخادم");
    }
}

// === تسجيل الدخول ===
async function loginUser(event) {
    event.preventDefault();
    console.log("loginUser called");

    const email = document.getElementById("login_email").value.trim();
    const password = document.getElementById("login_password").value.trim();

    if (!email || !password) {
        alert("رجاءً عبّئ كل الحقول");
        return;
    }

    try {
        const url = `${API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        const response = await fetch(url);
        const result = await response.json();
        console.log("login result:", result);

        if (result.status === "ok") {
            localStorage.setItem("userName", result.name);
            localStorage.setItem("userEmail", email);
            alert("تم تسجيل الدخول");
            window.location.href = "index.html";
        } else {
            alert("بيانات الدخول غير صحيحة");
        }
    } catch (err) {
        console.error(err);
        alert("فشل الاتصال بالخادم");
    }
}

// === تسجيل خروج ===
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

// === تحميل المنتجات ===
async function loadProducts() {
    console.log("loadProducts called");
    const container = document.getElementById("productsGrid");
    if (!container) return;

    container.innerHTML = "جاري تحميل المنتجات...";

    try {
        const response = await fetch(`${API_URL}?action=getInventory`);
        const result = await response.json();
        console.log("inventory result:", result);

        if (result.status !== "ok") {
            container.innerHTML = "خطأ في جلب المنتجات";
            return;
        }

        const products = result.data || [];
        if (!products.length) {
            container.innerHTML = "لا توجد منتجات";
            return;
        }

        container.innerHTML = "";
        products.forEach((p) => {
            container.innerHTML += `
                <div class="product-card">
                    <div class="product-title">${p.name}</div>
                    <div class="product-desc">${p.description || ""}</div>
                    <div class="product-price"><b>السعر:</b> ${p.price} ريال</div>
                    <div class="product-price"><b>المتوفر:</b> ${p.qty}</div>
                    <button class="btn-primary" onclick="addToCart(${p.id})" ${p.qty <= 0 ? "disabled" : ""}>
                        ${p.qty <= 0 ? "غير متوفر" : "إضافة للسلة"}
                    </button>
                </div>
            `;
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = "فشل الاتصال بالمخزن";
    }
}

// === إضافة للسلة + خصم من المخزون ===
async function addToCart(productId) {
    const email = localStorage.getItem("userEmail");
    if (!email) {
        alert("يجب تسجيل الدخول أولاً");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "addToCart",
                email,
                productId,
                qty: 1,
            }),
        });

        const result = await response.json();
        console.log("addToCart result:", result);

        if (result.status === "ok") {
            alert("تمت الإضافة للسلة وتم تحديث المخزون");
            loadProducts();
        } else {
            alert("خطأ في إضافة المنتج: " + (result.message || ""));
        }
    } catch (err) {
        console.error(err);
        alert("فشل الاتصال بالخادم");
    }
}

// === تهيئة الصفحة الرئيسية ===
function initIndexPage() {
    const name = localStorage.getItem("userName");
    if (!name) {
        window.location.href = "login.html";
        return;
    }
    const el = document.getElementById("welcomeUser");
    if (el) el.textContent = "مرحباً، " + name;
    loadProducts();
}
