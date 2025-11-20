// =======================
// إعدادات وحفظ بيانات بسيطة
// =======================

const STORAGE_KEYS = {
    USERS: "users",
    CURRENT_USER: "currentUser",
    CART_PREFIX: "cart_",
};

// منتجات تجريبية (MVP) - لاحقاً تربطها بقاعدة بيانات أو API
const PRODUCTS = [
    { id: 1, name: "كابل كهرباء 2 ملم", description: "متر واحد، نحاس، معزول", price: 10 },
    { id: 2, name: "لمبة LED 18W", description: "نور أبيض، موفرة للطاقة", price: 25 },
    { id: 3, name: "قاطع 20 أمبير", description: "لدوائر الإنارة والمخارج", price: 35 },
    { id: 4, name: "مفتاح جداري مزدوج", description: "تصميم عصري، لون أبيض", price: 15 },
];

// ============ أدوات عامة ============

function getUsers() {
    const json = localStorage.getItem(STORAGE_KEYS.USERS) || "[]";
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getCurrentUser() {
    const json = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
}

function getCartKey() {
    const user = getCurrentUser();
    if (!user) return null;
    return `${STORAGE_KEYS.CART_PREFIX}${user.email}`;
}

function getCart() {
    const key = getCartKey();
    if (!key) return [];
    const json = localStorage.getItem(key) || "[]";
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}

function saveCart(cart) {
    const key = getCartKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(cart));
}

function logout() {
    setCurrentUser(null);
    window.location.href = "login.html";
}

// حمايـة الصفحات التي تتطلب تسجيل دخول
function requireLogin() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return;
    }
}

// تحديث ترحيب المستخدم لو وجد العنصر
function updateWelcome() {
    const user = getCurrentUser();
    const el = document.getElementById("welcomeUser");
    if (el && user) {
        el.textContent = `أهلاً، ${user.name}`;
    }
}

// ============ منطق التسجيل ============

function initRegisterPage() {
    const form = document.getElementById("registerForm");
    const msg = document.getElementById("registerMsg");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim().toLowerCase();
        const password = document.getElementById("regPassword").value;

        msg.textContent = "";
        msg.className = "status";

        if (!name || !email || !password) {
            msg.textContent = "رجاءً تعبئة جميع الحقول.";
            msg.classList.add("error");
            return;
        }

        const users = getUsers();
        if (users.find((u) => u.email === email)) {
            msg.textContent = "هذا البريد مستخدم مسبقاً.";
            msg.classList.add("error");
            return;
        }

        const newUser = { name, email, password };
        users.push(newUser);
        saveUsers(users);
        setCurrentUser({ name, email });

        msg.textContent = "تم إنشاء الحساب بنجاح، سيتم تحويلك للصفحة الرئيسية...";
        msg.classList.add("success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    });
}

// ============ منطق تسجيل الدخول ============

function initLoginPage() {
    const form = document.getElementById("loginForm");
    const msg = document.getElementById("loginMsg");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        msg.textContent = "";
        msg.className = "status";

        const users = getUsers();
        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
            msg.textContent = "بيانات الدخول غير صحيحة.";
            msg.classList.add("error");
            return;
        }

        setCurrentUser({ name: user.name, email: user.email });
        msg.textContent = "تم تسجيل الدخول، سيتم تحويلك...";
        msg.classList.add("success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 800);
    });
}

// ============ المنتجات والسلة ============

function renderProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    grid.innerHTML = "";

    PRODUCTS.forEach((p) => {
        const div = document.createElement("div");
        div.className = "product-card";

        const html = `
            <div class="product-title">${p.name}</div>
            <div class="product-desc">${p.description || ""}</div>
            <div class="product-price"><b>السعر:</b> ${p.price} ريال</div>
            <button class="btn-primary" data-id="${p.id}">إضافة إلى السلة</button>
        `;

        div.innerHTML = html;
        grid.appendChild(div);
    });

    grid.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
            const id = parseInt(e.target.getAttribute("data-id"), 10);
            addToCart(id);
        }
    });
}

function addToCart(productId) {
    const cart = getCart();
    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ productId, qty: 1 });
    }
    saveCart(cart);
    alert("تمت إضافة المنتج إلى السلة.");
}

function renderCart() {
    const tbody = document.getElementById("cartBody");
    const totalEl = document.getElementById("cartTotal");
    const emptyEl = document.getElementById("cartEmpty");

    if (!tbody || !totalEl || !emptyEl) return;

    const cart = getCart();
    tbody.innerHTML = "";

    if (cart.length === 0) {
        emptyEl.style.display = "block";
        totalEl.textContent = "0";
        return;
    }

    emptyEl.style.display = "none";

    let total = 0;

    cart.forEach((item, index) => {
        const product = PRODUCTS.find((p) => p.id === item.productId);
        if (!product) return;

        const row = document.createElement("tr");
        const lineTotal = product.price * item.qty;
        total += lineTotal;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${product.name}</td>
            <td>${item.qty}</td>
            <td>${product.price} ريال</td>
            <td>${lineTotal} ريال</td>
            <td>
                <button class="btn-secondary" data-action="inc" data-id="${product.id}">+</button>
                <button class="btn-secondary" data-action="dec" data-id="${product.id}">-</button>
                <button class="btn-danger" data-action="remove" data-id="${product.id}">حذف</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    totalEl.textContent = total.toString();

    tbody.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") return;
        const action = e.target.getAttribute("data-action");
        const productId = parseInt(e.target.getAttribute("data-id"), 10);
        handleCartAction(action, productId);
    }, { once: true }); // once حتى لا نكرّر الـ listener
}

function handleCartAction(action, productId) {
    const cart = getCart();
    const item = cart.find((c) => c.productId === productId);
    if (!item) return;

    if (action === "inc") {
        item.qty += 1;
    } else if (action === "dec") {
        item.qty -= 1;
        if (item.qty <= 0) {
            const idx = cart.indexOf(item);
            cart.splice(idx, 1);
        }
    } else if (action === "remove") {
        const idx = cart.indexOf(item);
        cart.splice(idx, 1);
    }

    saveCart(cart);
    renderCart();
}

// ============ تهيئة الصفحات ============

function initIndexPage() {
    requireLogin();
    updateWelcome();
    renderProducts();
}

function initCartPage() {
    requireLogin();
    updateWelcome();
    renderCart();
}

