// DATABASE KEUANGAN OFFLINE - TMaal (localStorage-based)
let db = {
    users: [],
    currentUser: null,
    transactions: [],
    bills: [],
    inventory: []
};

// Temp state untuk pendaftaran multi-step
let tempUser = null;
let currentPinInput = "";
let currentTab = "home";

// State dan Navigasi Pendaftaran (Masjid vs UMKM)
let selectedRegisterChoice = "masjid";
function selectRegisterChoice(choice) {
    selectedRegisterChoice = choice;
    const choiceMasjidEl = document.getElementById("choice-masjid");
    const choiceUmkmEl = document.getElementById("choice-umkm");
    if (choiceMasjidEl) choiceMasjidEl.classList.toggle("active", choice === 'masjid');
    if (choiceUmkmEl) choiceUmkmEl.classList.toggle("active", choice === 'umkm');
}
function goToRegistrationFlow() {
    if (selectedRegisterChoice === "masjid") {
        navigateTo("register-1");
    } else {
        navigateTo("register-2");
    }
}

// Data Awal Mockup agar aplikasi tidak kosong saat pertama dibuka
const defaultBills = [
    { id: "bill-1", name: "Listrik PLN & Penerangan Jalan", amount: 350000, dueDate: "2026-06-10", status: "pending" },
    { id: "bill-2", name: "Internet Speedy & Layanan Informasi", amount: 280000, dueDate: "2026-06-15", status: "pending" },
    { id: "bill-3", name: "Air PDAM Bersih", amount: 120000, dueDate: "2026-06-20", status: "pending" }
];

const defaultInventory = [
    { id: "inv-1", itemName: "Karpet Sajadah Premium (Roll)", quantity: 12, condition: "Baik", value: 1500000 },
    { id: "inv-2", itemName: "Sound System & Microphone Wireless", quantity: 2, condition: "Baik", value: 4500000 },
    { id: "inv-3", itemName: "Pendingin Ruangan (AC) 2 PK", quantity: 4, condition: "Baik", value: 3800000 },
    { id: "inv-4", itemName: "Lemari Kaca Inventaris Masjid", quantity: 1, condition: "Rusak", value: 1200000 }
];

const defaultUMKMBills = [
    { id: "bill-u1", name: "Sewa Tempat Usaha Bulanan", amount: 1500000, dueDate: "2026-06-05", status: "pending" },
    { id: "bill-u2", name: "Tagihan Listrik PLN UMKM", amount: 450000, dueDate: "2026-06-12", status: "pending" }
];

const defaultUMKMInventory = [
    { id: "inv-u1", itemName: "Etalase Kaca Display", quantity: 2, condition: "Baik", value: 2500000 },
    { id: "inv-u2", itemName: "Mesin Kasir Point of Sale (POS)", quantity: 1, condition: "Baik", value: 3200000 },
    { id: "inv-u3", itemName: "Kipas Angin Dinding Industrial", quantity: 3, condition: "Baik", value: 650000 }
];

// INISIALISASI SAAT HALAMAN DI-LOAD
window.addEventListener("DOMContentLoaded", () => {
    loadDatabase();
    runSplashScreen();
    setupKeyboardPinListener();
    registerServiceWorker();
});

// Registrasi Service Worker PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker PWA terdaftar dengan sukses!', reg))
            .catch(err => console.error('Gagal mendaftarkan Service Worker PWA:', err));
    }
}

// LOAD & SAVE KE LOCALSTORAGE
function loadDatabase() {
    const localData = localStorage.getItem("tmaal_db");
    if (localData) {
        try {
            db = JSON.parse(localData);
        } catch (e) {
            console.error("Gagal membaca database lokal, membuat baru.", e);
            saveDatabase();
        }
    } else {
        // Jika data benar-benar kosong, siapkan database awal kosong
        db = {
            users: [],
            currentUser: null,
            transactions: [],
            bills: [],
            inventory: []
        };
        saveDatabase();
    }
}

function saveDatabase() {
    localStorage.setItem("tmaal_db", JSON.stringify(db));
}

// SIMULASI SPLASH SCREEN & CEK LOGIN
function runSplashScreen() {
    const progressBar = document.getElementById("splash-progress");
    let width = 0;
    
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            checkLoginStatus();
        } else {
            width += 5; // progress naik
            progressBar.style.width = width + "%";
        }
    }, 80);
}

function checkLoginStatus() {
    if (db.currentUser) {
        // Jika sesi aktif, masuk ke halaman PIN
        navigateTo("pin");
    } else {
        // Jika tidak, masuk ke halaman Login
        navigateTo("login");
    }
}

// SISTEM ROUTER SPA SEDERHANA
function navigateTo(screenId) {
    // Sembunyikan semua layar
    const screens = document.querySelectorAll(".screen");
    screens.forEach(s => {
        s.classList.remove("active");
        s.style.display = "none";
    });
    
    // Tampilkan layar yang dituju
    const targetScreen = document.getElementById(screenId + "-screen");
    if (targetScreen) {
        targetScreen.style.display = "flex";
        // Beri jeda kecil agar transisi CSS opacity bekerja
        setTimeout(() => {
            targetScreen.classList.add("active");
        }, 50);
    }
    
    // Reset state tertentu jika keluar dari layar PIN
    if (screenId !== "pin") {
        currentPinInput = "";
        updatePinDots();
    }
}

// TOAST NOTIFIKASI MODERN
function showToast(message, type = "success") {
    // Buat container toast jika belum ada
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement("div");
    toast.style.cssText = `
        background-color: ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#f59e0b'};
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
    `;
    
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : type === 'danger' ? '<i class="fa-solid fa-circle-xmark"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 10);
    
    // Animate out & remove
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// LOGIKA PENDAFTARAN & LOGIN

// 1. Login Akun
function handleLogin(event) {
    event.preventDefault();
    const identifier = document.getElementById("login-identifier").value.trim();
    const password = document.getElementById("login-password").value.trim();
    
    if (!identifier || !password) {
        showToast("Harap isi email/telepon dan kata sandi Anda!", "warning");
        return;
    }
    
    // Cari user berdasarkan email atau no telp
    const user = db.users.find(u => (u.email === identifier || u.phone === identifier) && u.password === password);
    
    if (user) {
        db.currentUser = user;
        saveDatabase();
        showToast("Autentikasi berhasil! Masukkan PIN Anda.", "success");
        navigateTo("pin");
    } else {
        showToast("Email/Telepon atau Kata Sandi salah!", "danger");
    }
}

// 2. Registrasi Langkah 1: Masjid / Mushola
function handleRegister1(event) {
    event.preventDefault();
    const name = document.getElementById("reg1-name").value.trim();
    const phone = document.getElementById("reg1-phone").value.trim();
    const email = document.getElementById("reg1-email").value.trim();
    const userType = document.getElementById("reg1-type").value;
    
    // Validasi email unik
    if (db.users.find(u => u.email === email || u.phone === phone)) {
        showToast("Email atau nomor telepon sudah terdaftar!", "warning");
        return;
    }
    
    tempUser = {
        fullName: name,
        phone: phone,
        email: email,
        userType: userType // 'masjid' atau 'mushola'
    };
    
    navigateTo("verification-1");
}

// 3. Verifikasi Langkah 2 (Buat password & PIN): Masjid / Mushola
function handleVerif1(event) {
    event.preventDefault();
    const password = document.getElementById("verif1-password").value;
    const confirm = document.getElementById("verif1-confirm").value;
    const pin = document.getElementById("verif1-pin").value;
    
    if (password !== confirm) {
        showToast("Konfirmasi kata sandi tidak cocok!", "danger");
        return;
    }
    
    if (pin.length !== 6 || isNaN(pin)) {
        showToast("PIN harus berupa 6 digit angka!", "warning");
        return;
    }
    
    // Simpan user ke db
    const newUser = {
        ...tempUser,
        password: password,
        pin: pin
    };
    
    db.users.push(newUser);
    
    // Setup mockup awal khusus untuk user ini agar app tidak kosong
    initializeUserMockups(newUser.email, newUser.userType);
    
    db.currentUser = null; // Biarkan login manual setelah registrasi
    saveDatabase();
    
    showToast("Pendaftaran Masjid/Mushola berhasil! Silakan masuk.", "success");
    tempUser = null;
    
    // Reset forms
    document.getElementById("register-1-form").reset();
    document.getElementById("verif-1-form").reset();
    
    navigateTo("login");
}

// 4. Registrasi Langkah 1: UMKM / Usaha
function handleRegister2(event) {
    event.preventDefault();
    const bizName = document.getElementById("reg2-bizname").value.trim();
    const owner = document.getElementById("reg2-owner").value.trim();
    const phone = document.getElementById("reg2-phone").value.trim();
    const email = document.getElementById("reg2-email").value.trim();
    const address = document.getElementById("reg2-address").value.trim();
    const city = document.getElementById("reg2-city").value.trim();
    
    if (db.users.find(u => u.email === email || u.phone === phone)) {
        showToast("Email atau nomor telepon sudah terdaftar!", "warning");
        return;
    }
    
    tempUser = {
        businessName: bizName,
        fullName: owner, // owner name
        phone: phone,
        email: email,
        address: address,
        city: city,
        userType: "umkm"
    };
    
    navigateTo("verification-2");
}

// 5. Verifikasi Langkah 2 (Buat password & PIN): UMKM
function handleVerif2(event) {
    event.preventDefault();
    const password = document.getElementById("verif2-password").value;
    const confirm = document.getElementById("verif2-confirm").value;
    const pin = document.getElementById("verif2-pin").value;
    
    if (password !== confirm) {
        showToast("Konfirmasi kata sandi tidak cocok!", "danger");
        return;
    }
    
    if (pin.length !== 6 || isNaN(pin)) {
        showToast("PIN harus berupa 6 digit angka!", "warning");
        return;
    }
    
    const newUser = {
        ...tempUser,
        password: password,
        pin: pin
    };
    
    db.users.push(newUser);
    
    // Setup mockup awal khusus untuk UMKM ini
    initializeUserMockups(newUser.email, "umkm");
    
    db.currentUser = null;
    saveDatabase();
    
    showToast("Pendaftaran UMKM berhasil! Silakan masuk.", "success");
    tempUser = null;
    
    // Reset forms
    document.getElementById("register-2-form").reset();
    document.getElementById("verif-2-form").reset();
    
    navigateTo("login");
}

// Setup data awal (tagihan & inventaris) untuk user baru agar tidak kosong
function initializeUserMockups(userEmail, userType) {
    const initialBills = userType === "umkm" ? defaultUMKMBills : defaultBills;
    const initialInventory = userType === "umkm" ? defaultUMKMInventory : defaultInventory;
    
    // Petakan bill ke user email
    initialBills.forEach(b => {
        db.bills.push({
            ...b,
            id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userEmail: userEmail
        });
    });
    
    // Petakan inventaris ke user email
    initialInventory.forEach(inv => {
        db.inventory.push({
            ...inv,
            id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userEmail: userEmail
        });
    });
}

// Lupa Password Offline
function showForgotPassword() {
    alert("Untuk merestart kata sandi secara offline, silakan hubungi Administrator Sistem atau lakukan Reset Database jika Anda baru mulai menggunakan aplikasi.");
}

// LOGIKA INPUT PIN KEAMANAN
function pressPin(key) {
    if (key === "back") {
        if (currentPinInput.length > 0) {
            currentPinInput = currentPinInput.slice(0, -1);
        }
    } else {
        if (currentPinInput.length < 6) {
            currentPinInput += key;
        }
    }
    
    updatePinDots();
    
    // Cek jika sudah 6 digit
    if (currentPinInput.length === 6) {
        // Beri sedikit jeda visual agar bulatan terakhir terlihat terisi
        setTimeout(verifyPin, 100);
    }
}

function updatePinDots() {
    const dots = document.querySelectorAll("#pin-dots .pin-dot");
    dots.forEach((dot, index) => {
        if (index < currentPinInput.length) {
            dot.classList.add("filled");
        } else {
            dot.classList.remove("filled");
        }
    });
}

function verifyPin() {
    if (!db.currentUser) {
        navigateTo("login");
        return;
    }
    
    if (currentPinInput === db.currentUser.pin) {
        showToast("PIN Terverifikasi! Selamat Datang.", "success");
        initDashboard();
        navigateTo("dashboard");
    } else {
        // PIN salah, buat animasi getar/shake pada kontainer dots
        const dotsContainer = document.getElementById("pin-dots");
        dotsContainer.classList.add("shake-animation");
        showToast("Kode PIN yang Anda masukkan salah!", "danger");
        
        // Hapus class animasi setelah selesai agar bisa di-trigger lagi nanti
        setTimeout(() => {
            dotsContainer.classList.remove("shake-animation");
            currentPinInput = "";
            updatePinDots();
        }, 400);
    }
}

// Listener Keyboard Fisik untuk Layar PIN
function setupKeyboardPinListener() {
    window.addEventListener("keydown", (e) => {
        // Hanya trigger jika kita sedang di layar PIN
        const pinScreen = document.getElementById("pin-screen");
        if (pinScreen && pinScreen.classList.contains("active")) {
            if (e.key >= "0" && e.key <= "9") {
                pressPin(e.key);
            } else if (e.key === "Backspace") {
                pressPin("back");
            }
        }
    });
}


// LOGIKA UTAMA DASHBOARD

// 1. Inisialisasi Tampilan Dashboard
function initDashboard() {
    const user = db.currentUser;
    if (!user) return;
    
    // Terapkan Tema Warna dinamis
    document.body.className = user.userType === "umkm" ? "theme-umkm" : "theme-masjid";
    
    // Set icon header dinamis
    const headerIcon = document.getElementById("dashboard-header-icon");
    if (headerIcon) {
        headerIcon.className = user.userType === "umkm" ? "fa-solid fa-store" : "fa-solid fa-mosque";
    }
    
    // Set greeting dinamis
    const greetingText = document.getElementById("dashboard-greeting-text");
    if (greetingText) {
        greetingText.innerText = user.userType === "umkm" ? "Salam Sejahtera," : "Assalamualaikum,";
    }
    
    // Header Info & Nama Organisasi (Mencegah redundansi kata "Masjid" atau "Mushola")
    let orgName = "";
    if (user.userType === "umkm") {
        orgName = user.businessName;
    } else {
        const typePrefix = user.userType.toUpperCase(); // 'MASJID' atau 'MUSHOLA'
        const lowerName = user.fullName.toLowerCase();
        if (lowerName.startsWith("masjid") || lowerName.startsWith("mushola") || lowerName.startsWith("musholla")) {
            orgName = user.fullName;
        } else {
            orgName = `${typePrefix} ${user.fullName}`;
        }
    }
    document.getElementById("header-org-name").innerText = orgName;
    document.getElementById("print-org-name").innerText = orgName;
    
    // Tampilkan Hari & Tanggal Hari Ini
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString('id-ID', options);
    document.getElementById("header-current-date").innerText = todayStr;
    document.getElementById("print-meta-date").innerText = `Tanggal Cetak Laporan: ${todayStr}`;
    
    // Badge Pengurus (Null-safe check untuk elemen header lama)
    const initials = user.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const initialsEl = document.getElementById("header-avatar-initials");
    if (initialsEl) initialsEl.innerText = initials;
    const userNameEl = document.getElementById("header-user-name");
    if (userNameEl) userNameEl.innerText = user.fullName;
    const userRoleEl = document.getElementById("header-user-role");
    if (userRoleEl) userRoleEl.innerText = user.userType === 'umkm' ? 'UMKM' : user.userType;
    
    document.getElementById("profile-avatar").innerText = initials;
    
    // Render Ringkasan Uang, Riwayat Transaksi & Chart
    updateFinancialSummary();
    renderRecentTransactions();
    renderMiniChart();
    
    // Profile Tab Updates
    document.getElementById("profile-name").innerText = orgName;
    document.getElementById("profile-type").innerText = user.userType === 'umkm' ? 'USAHA UMKM' : user.userType.toUpperCase();
    document.getElementById("profile-owner").innerText = user.fullName;
    document.getElementById("profile-phone").innerText = user.phone;
    document.getElementById("profile-email").innerText = user.email;
    
    const bizAddressItem = document.getElementById("profile-biz-address-item");
    const bizCityItem = document.getElementById("profile-biz-city-item");
    if (user.userType === "umkm") {
        document.getElementById("profile-address").innerText = user.address;
        document.getElementById("profile-city").innerText = user.city;
        bizAddressItem.style.display = "block";
        bizCityItem.style.display = "block";
    } else {
        bizAddressItem.style.display = "none";
        bizCityItem.style.display = "none";
    }
}

// 2. Hitung & Update Summary (Saldo, Pemasukan, Pengeluaran)
function updateFinancialSummary() {
    const user = db.currentUser;
    const transactions = db.transactions.filter(t => t.userEmail === user.email);
    
    let balance = 0;
    let incomeMonth = 0;
    let expenseMonth = 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    transactions.forEach(t => {
        const amt = parseFloat(t.amount);
        const tDate = new Date(t.date);
        
        if (t.type === "in") {
            balance += amt;
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                incomeMonth += amt;
            }
        } else if (t.type === "out") {
            balance -= amt;
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                expenseMonth += amt;
            }
        }
    });
    
    // Format mata uang Rupiah
    document.getElementById("dashboard-balance").innerText = formatRupiah(balance);
    document.getElementById("dashboard-income").innerText = formatRupiah(incomeMonth);
    document.getElementById("dashboard-expense").innerText = formatRupiah(expenseMonth);
    
    // Format Jam update terakhir
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const balanceUpdateEl = document.getElementById("dashboard-balance-update");
    if (balanceUpdateEl) {
        balanceUpdateEl.innerText = `Terakhir diupdate pukul ${timeStr} WIB`;
    }
}

// 3. Render Riwayat Pendek di Beranda (Maksimal 5)
function renderRecentTransactions() {
    const user = db.currentUser;
    const transactions = db.transactions.filter(t => t.userEmail === user.email);
    
    // Urutkan berdasarkan tanggal terbaru
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const container = document.getElementById("recent-transactions-container");
    
    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <p>Belum ada aktivitas kas. Gunakan tombol di atas untuk mencatatkan kas keuangan pertama Anda!</p>
            </div>
        `;
        return;
    }
    
    let html = "";
    sorted.forEach(t => {
        const isIncome = t.type === "in";
        const icon = isIncome ? '<i class="fa-solid fa-receipt"></i>' : '<i class="fa-solid fa-money-bill-wave"></i>';
        const typeClass = isIncome ? 'in' : 'out';
        const sign = isIncome ? '+' : '-';
        
        const dateFormatted = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        html += `
            <div class="transaction-item">
                <div class="item-left">
                    <div class="item-icon ${typeClass}">${icon}</div>
                    <div class="item-details">
                        <span class="item-title">${escapeHTML(t.description)}</span>
                        <span class="item-meta">${dateFormatted} • <b style="text-transform: capitalize;">${t.category}</b></span>
                    </div>
                </div>
                <div class="item-amount ${typeClass}">${sign} ${formatRupiah(t.amount)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 4. Penggambaran Donut Chart (Canvas) secara murni Offline
function renderMiniChart() {
    const user = db.currentUser;
    const transactions = db.transactions.filter(t => t.userEmail === user.email);
    
    let totalIn = 0;
    let totalOut = 0;
    
    transactions.forEach(t => {
        if (t.type === "in") totalIn += parseFloat(t.amount);
        else totalOut += parseFloat(t.amount);
    });
    
    const canvas = document.getElementById("mini-chart");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set resolusi internal canvas agar tajam di layar retina/HD
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = 220;
    const height = 220;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 65;
    
    // Jika tidak ada data kas
    if (totalIn === 0 && totalOut === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 18;
        ctx.stroke();
        
        ctx.font = "bold 13px Inter";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Tidak Ada Data", centerX, centerY);
        return;
    }
    
    const total = totalIn + totalOut;
    const inPct = (totalIn / total) * 100;
    const outPct = (totalOut / total) * 100;
    
    const inAngle = (totalIn / total) * 2 * Math.PI;
    
    // Gambar arc Pemasukan (Hijau / Biru Tema)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + inAngle);
    // Pilih warna berdasar tema
    const colorIn = user.userType === "umkm" ? "#2563eb" : "#10b981";
    ctx.strokeStyle = colorIn;
    ctx.lineWidth = 18;
    ctx.stroke();
    
    // Gambar arc Pengeluaran (Merah PLN)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2 + inAngle, 1.5 * Math.PI);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 18;
    ctx.stroke();
    
    // Text di tengah donut
    ctx.font = "bold 13px Inter";
    ctx.fillStyle = colorIn;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(inPct)}% Masuk`, centerX, centerY - 10);
    
    ctx.font = "bold 13px Inter";
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`${Math.round(outPct)}% Keluar`, centerX, centerY + 12);
}

// SISTEM MANAJEMEN TAB NAVIGATION
function switchTab(tabId) {
    currentTab = tabId;
    
    // Nonaktifkan semua tab
    const tabs = document.querySelectorAll(".tab-content");
    tabs.forEach(t => t.classList.remove("active"));
    
    // Aktifkan tab target
    const targetTab = document.getElementById("tab-" + tabId);
    if (targetTab) targetTab.classList.add("active");
    
    // Update Menu Sidebar Active Class
    const sidebarItems = document.querySelectorAll(".sidebar-item");
    sidebarItems.forEach(item => item.classList.remove("active"));
    
    const sideActive = document.getElementById("side-tab-" + tabId);
    if (sideActive) sideActive.classList.add("active");
    
    // Update Mobile Bottom Nav Class
    const mobileItems = document.querySelectorAll(".mobile-nav-item");
    mobileItems.forEach(item => item.classList.remove("active"));
    
    const mobileActive = document.getElementById("mobile-tab-" + tabId);
    if (mobileActive) mobileActive.classList.add("active");
    
    // Refresh tab content yang sesuai
    if (tabId === "home") {
        updateFinancialSummary();
        renderRecentTransactions();
        renderMiniChart();
    } else if (tabId === "history") {
        renderFullHistory();
    } else if (tabId === "profile") {
        // Tab profil sudah terupdate saat login, tapi pastikan reload info
    }
}

// SISTEM MODAL MANAGEMENT
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add("active");
        }, 50);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
    }
}

// MODAL A: LOGIKA CATAT KEUANGAN (PEMASUKAN / PENGELUARAN)
function openCashflowModal() {
    // Set default tanggal hari ini
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("cf-date").value = today;
    
    // Trigger kategori default
    toggleCashflowKategori('in');
    
    // Reset form
    document.getElementById("cashflow-form").reset();
    document.getElementById("cf-date").value = today;
    
    openModal("cashflow-modal");
}

// Dinamis mengisi dropdown kategori sesuai Jenis Pengguna & Tipe Transaksi
function toggleCashflowKategori(type) {
    const user = db.currentUser;
    const catSelect = document.getElementById("cf-category");
    if (!catSelect || !user) return;
    
    let categories = [];
    
    if (user.userType === "umkm") {
        if (type === "in") {
            categories = ["Penjualan/Usaha", "Investasi Masuk", "Piutang Diterima", "Lainnya"];
        } else {
            categories = ["Belanja Bahan Baku", "Operasional Toko", "Sewa Tempat", "Gaji Karyawan", "Tagihan", "Lainnya"];
        }
    } else { // Masjid & Mushola
        if (type === "in") {
            categories = ["Sumbangan/Donasi", "Kotak Amal Jumat", "Amal Yatim & Sosial", "Hibah", "Lainnya"];
        } else {
            categories = ["Operasional", "Inventaris/Asset", "Sosial & Dakwah", "Pembangunan & Perbaikan", "Tagihan", "Lainnya"];
        }
    }
    
    let html = "";
    categories.forEach(c => {
        html += `<option value="${c}">${c}</option>`;
    });
    catSelect.innerHTML = html;
}

function handleSaveCashflow(event) {
    event.preventDefault();
    const user = db.currentUser;
    
    const type = document.querySelector('input[name="cf-type"]:checked').value;
    const amount = parseFloat(document.getElementById("cf-amount").value);
    const category = document.getElementById("cf-category").value;
    const date = document.getElementById("cf-date").value;
    const desc = document.getElementById("cf-desc").value.trim();
    
    if (isNaN(amount) || amount <= 0) {
        showToast("Nominal uang harus lebih besar dari 0!", "warning");
        return;
    }
    
    const newTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userEmail: user.email,
        type: type, // 'in' atau 'out'
        amount: amount,
        category: category,
        date: date,
        description: desc
    };
    
    db.transactions.push(newTransaction);
    saveDatabase();
    
    showToast("Berhasil mencatat kas keuangan!", "success");
    closeModal("cashflow-modal");
    
    // Refresh screen saat ini
    if (currentTab === "home") {
        initDashboard();
    } else {
        renderFullHistory();
    }
}


// MODAL B: MANAJEMEN & PEMBAYARAN TAGIHAN
function openBillsModal() {
    renderBillsList();
    openModal("bills-modal");
}

function renderBillsList() {
    const user = db.currentUser;
    const container = document.getElementById("bills-list-container");
    // Filter tagihan yang terasosiasi dengan user ini
    const userBills = db.bills.filter(b => b.userEmail === user.email);
    
    if (userBills.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 20px 0;">
                <i class="fa-solid fa-file-circle-check"></i>
                <p>Tidak ada tagihan utilitas terdaftar saat ini.</p>
            </div>
        `;
        return;
    }
    
    let html = "";
    userBills.forEach(b => {
        const isPaid = b.status === "paid";
        const btnHtml = isPaid 
            ? '<button class="btn-pay-bill paid" disabled><i class="fa-solid fa-check-double"></i> Lunas</button>'
            : `<button class="btn-pay-bill" onclick="payBill('${b.id}')"><i class="fa-solid fa-money-bill-wave"></i> Bayar</button>`;
            
        const dateStr = new Date(b.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        html += `
            <div class="bill-item">
                <div class="bill-info">
                    <span class="bill-title">${escapeHTML(b.name)}</span>
                    <span class="bill-meta" style="font-size:11px; color:#64748b; margin-top:2px;">Tempo: ${dateStr}</span>
                </div>
                <div class="bill-right">
                    <span class="bill-amount">${formatRupiah(b.amount)}</span>
                    ${btnHtml}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function handleSaveBill(event) {
    event.preventDefault();
    const user = db.currentUser;
    
    const name = document.getElementById("bill-name").value.trim();
    const amount = parseFloat(document.getElementById("bill-amount").value);
    const dueDate = document.getElementById("bill-due").value;
    
    if (isNaN(amount) || amount <= 0) {
        showToast("Nominal tagihan harus valid!", "warning");
        return;
    }
    
    const newBill = {
        id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userEmail: user.email,
        name: name,
        amount: amount,
        dueDate: dueDate,
        status: "pending"
    };
    
    db.bills.push(newBill);
    saveDatabase();
    
    showToast("Tagihan baru berhasil didaftarkan!", "success");
    document.getElementById("new-bill-form").reset();
    renderBillsList();
    updateFinancialSummary();
}

function payBill(billId) {
    const user = db.currentUser;
    const bill = db.bills.find(b => b.id === billId && b.userEmail === user.email);
    
    if (!bill) {
        showToast("Tagihan tidak ditemukan!", "danger");
        return;
    }
    
    // Periksa apakah saldo mencukupi
    let balance = 0;
    const userTransactions = db.transactions.filter(t => t.userEmail === user.email);
    userTransactions.forEach(t => {
        if (t.type === "in") balance += parseFloat(t.amount);
        else balance -= parseFloat(t.amount);
    });
    
    if (balance < bill.amount) {
        showToast("Saldo kas Anda tidak mencukupi untuk membayar tagihan ini!", "danger");
        return;
    }
    
    // Update status tagihan
    bill.status = "paid";
    
    // Otomatis masukkan pengeluaran ke kas keuangan
    const today = new Date().toISOString().split('T')[0];
    const newTx = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userEmail: user.email,
        type: "out",
        amount: bill.amount,
        category: "Tagihan",
        date: today,
        description: `Bayar tagihan utilitas: ${bill.name}`
    };
    
    db.transactions.push(newTx);
    saveDatabase();
    
    showToast(`Tagihan "${bill.name}" berhasil dibayar! Tercatat di Riwayat Keuangan.`, "success");
    renderBillsList();
    initDashboard(); // Update summary saldo utama
}


// MODAL C: INVENTARIS BARANG & ASET DENGAN KUANTITAS DINAMIS
function openInventoryModal() {
    renderInventoryList();
    // Reset form
    document.getElementById("new-item-form").reset();
    openModal("inventory-modal");
}

function renderInventoryList() {
    const user = db.currentUser;
    const container = document.getElementById("inventory-list-container");
    const userInv = db.inventory.filter(i => i.userEmail === user.email);
    
    if (userInv.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 20px 0;">
                <i class="fa-solid fa-boxes-packing"></i>
                <p>Belum ada aset inventaris terdaftar.</p>
            </div>
        `;
        return;
    }
    
    let html = "";
    userInv.forEach(item => {
        const condClass = item.condition.toLowerCase() === 'baik' ? 'baik' : 'rusak';
        
        html += `
            <div class="inventory-card">
                <div>
                    <div class="inv-header">
                        <span class="inv-name">${escapeHTML(item.itemName)}</span>
                        <span class="inv-badge-condition ${condClass}">${item.condition}</span>
                    </div>
                    <div class="inv-body">
                        <div class="inv-value">Nilai: <b>${formatRupiah(item.value)}</b> / unit</div>
                        <div class="inv-value" style="font-size:11px; margin-top:2px;">Total Aset: ${formatRupiah(item.value * item.quantity)}</div>
                    </div>
                </div>
                
                <div class="inv-footer">
                    <span class="inv-qty-label">Stok:</span>
                    <div class="inv-qty-controls">
                        <button class="btn-qty" onclick="adjustInventoryQty('${item.id}', -1)">-</button>
                        <span class="inv-qty-value">${item.quantity}</span>
                        <button class="btn-qty" onclick="adjustInventoryQty('${item.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function handleSaveInventory(event) {
    event.preventDefault();
    const user = db.currentUser;
    
    const name = document.getElementById("inv-item-name").value.trim();
    const qty = parseInt(document.getElementById("inv-item-qty").value);
    const cond = document.getElementById("inv-item-condition").value;
    const value = parseFloat(document.getElementById("inv-item-value").value);
    
    if (isNaN(qty) || qty <= 0 || isNaN(value) || value < 0) {
        showToast("Masukkan data barang dengan benar!", "warning");
        return;
    }
    
    const newItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userEmail: user.email,
        itemName: name,
        quantity: qty,
        condition: cond,
        value: value
    };
    
    db.inventory.push(newItem);
    saveDatabase();
    
    showToast(`Aset "${name}" berhasil ditambahkan ke inventaris!`, "success");
    document.getElementById("new-item-form").reset();
    renderInventoryList();
}

// Tambah / Kurang Stok secara dinamis langsung pada list card
function adjustInventoryQty(itemId, amount) {
    const user = db.currentUser;
    const item = db.inventory.find(i => i.id === itemId && i.userEmail === user.email);
    
    if (!item) return;
    
    const newQty = item.quantity + amount;
    if (newQty < 0) {
        showToast("Stok barang tidak boleh kurang dari 0!", "warning");
        return;
    }
    
    // Jika stok diset ke 0, tanya apakah mau dihapus dari daftar?
    if (newQty === 0) {
        const confirmDelete = confirm(`Stok barang "${item.itemName}" menjadi 0. Apakah Anda ingin menghapus barang ini dari daftar inventaris?`);
        if (confirmDelete) {
            db.inventory = db.inventory.filter(i => i.id !== itemId);
            saveDatabase();
            showToast(`Aset "${item.itemName}" dihapus dari inventaris.`, "success");
            renderInventoryList();
            return;
        } else {
            return; // Batalkan pengurangan ke 0
        }
    }
    
    item.quantity = newQty;
    saveDatabase();
    
    showToast(`Stok "${item.itemName}" berhasil diupdate.`, "success");
    renderInventoryList();
}


// RIWAYAT KEUANGAN LENGKAP (TAB RIWAYAT KEUANGAN)

function renderFullHistory() {
    const user = db.currentUser;
    const transactions = db.transactions.filter(t => t.userEmail === user.email);
    
    // Ambil keyword filter pencarian & dropdown
    const searchVal = document.getElementById("search-history").value.toLowerCase();
    const typeFilter = document.getElementById("filter-type").value;
    const catFilter = document.getElementById("filter-category").value;
    
    const tbody = document.getElementById("history-table-body");
    const emptyState = document.getElementById("history-empty");
    
    // Urutkan data transaksi berdasar tanggal terbaru
    let filtered = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Filter Pencarian
    if (searchVal) {
        filtered = filtered.filter(t => t.description.toLowerCase().includes(searchVal));
    }
    
    // Filter Tipe (Pemasukan / Pengeluaran)
    if (typeFilter !== "all") {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    // Filter Kategori
    if (catFilter !== "all") {
        filtered = filtered.filter(t => t.category === catFilter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "block";
        return;
    }
    
    emptyState.style.display = "none";
    let html = "";
    
    filtered.forEach(t => {
        const isIncome = t.type === "in";
        const badgeLabel = isIncome ? "Masuk" : "Keluar";
        const badgeClass = isIncome ? "in" : "out";
        const amountFormatted = isIncome ? `+ ${formatRupiah(t.amount)}` : `- ${formatRupiah(t.amount)}`;
        const amountClass = isIncome ? "in" : "out";
        
        const dateFormatted = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        html += `
            <tr id="row-${t.id}">
                <td>${dateFormatted}</td>
                <td><b>${t.category}</b></td>
                <td>${escapeHTML(t.description)}</td>
                <td><span class="badge-tag ${badgeClass}">${badgeLabel}</span></td>
                <td class="item-amount ${amountClass}">${amountFormatted}</td>
                <td style="text-align: center;">
                    <button class="link-btn" style="color:var(--danger);" onclick="deleteTransaction('${t.id}')">
                        <i class="fa-regular fa-trash-can"></i> Hapus
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function filterHistory() {
    renderFullHistory();
}

function deleteTransaction(txId) {
    const confirmDelete = confirm("Apakah Anda yakin ingin menghapus data catatan kas ini?");
    if (!confirmDelete) return;
    
    const user = db.currentUser;
    
    // Cari transaksi & pastikan milik user saat ini
    const txIndex = db.transactions.findIndex(t => t.id === txId && t.userEmail === user.email);
    
    if (txIndex > -1) {
        const tx = db.transactions[txIndex];
        
        // Hapus transaksi
        db.transactions.splice(txIndex, 1);
        saveDatabase();
        showToast("Catatan kas berhasil dihapus!", "success");
        
        // Refresh
        renderFullHistory();
    } else {
        showToast("Transaksi tidak ditemukan!", "danger");
    }
}


// LAPORAN KEUANGAN: EKSPOR KE CSV & CETAK PDF

// 1. Ekspor CSV
function exportToCSV() {
    const user = db.currentUser;
    const transactions = db.transactions.filter(t => t.userEmail === user.email);
    
    if (transactions.length === 0) {
        showToast("Belum ada data keuangan untuk diekspor!", "warning");
        return;
    }
    
    // Header CSV
    let csvContent = "Tanggal,Kategori,Deskripsi,Tipe Kas,Jumlah Uang\n";
    
    transactions.forEach(t => {
        const typeStr = t.type === "in" ? "Pemasukan" : "Pengeluaran";
        // Bersihkan koma pada deskripsi agar tidak mengganggu kolom CSV
        const cleanedDesc = t.description.replace(/,/g, " ");
        csvContent += `${t.date},${t.category},${cleanedDesc},${typeStr},${t.amount}\n`;
    });
    
    // Download file blob CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const safeOrgName = (user.userType === "umkm" ? user.businessName : user.fullName).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `laporan_keuangan_${safeOrgName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Berhasil mengekspor Laporan CSV!", "success");
}

// 2. Cetak Laporan Keuangan (PDF via CSS Print Styles)
function printReport() {
    const user = db.currentUser;
    const transactions = db.transactions.filter(t => t.userEmail === user.email);
    
    if (transactions.length === 0) {
        showToast("Belum ada data keuangan untuk dicetak!", "warning");
        return;
    }
    
    // Pindahkan layar aktif sementara ke Tab Riwayat untuk visual cetak penuh
    const currentActiveTab = currentTab;
    switchTab("history");
    
    // Trigger cetak browser
    window.print();
    
    // Kembalikan ke tab asal
    if (currentActiveTab !== "history") {
        setTimeout(() => {
            switchTab(currentActiveTab);
        }, 1000);
    }
}


// BACKUP & RESTORE SISTEM DATABASE OFFLINE (JSON FILE)

// 1. Ekspor Database ke File JSON
function triggerExportJSON() {
    const user = db.currentUser;
    
    // Siapkan data backup bersih
    const backupData = {
        app: "TMaal Offline Financial App",
        exportDate: new Date().toISOString(),
        users: db.users,
        transactions: db.transactions,
        bills: db.bills,
        inventory: db.inventory
    };
    
    const strData = JSON.stringify(backupData, null, 4);
    const blob = new Blob([strData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const safeName = user.fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `tmaal_database_backup_${safeName}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Database Offline berhasil diekspor ke file JSON!", "success");
}

// 2. Trigger Unggah Cadangan
function triggerImportJSON() {
    document.getElementById("import-json-file").click();
}

// 3. Proses Impor File JSON
function handleImportJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            // Validasi format struktur database backup
            if (imported.app && imported.users && imported.transactions) {
                // Konfirmasi ke user
                const confirmOverwrite = confirm("Perhatian! Mengimpor data baru akan menggabungkan database saat ini. Apakah Anda yakin ingin memproses impor data cadangan?");
                if (confirmOverwrite) {
                    // Gabungkan users yang belum ada di database
                    imported.users.forEach(impUser => {
                        const exists = db.users.some(u => u.email === impUser.email);
                        if (!exists) db.users.push(impUser);
                    });
                    
                    // Impor riwayat transaksi (ambil transaksi yang belum ada ID-nya)
                    imported.transactions.forEach(impTx => {
                        const exists = db.transactions.some(t => t.id === impTx.id);
                        if (!exists) db.transactions.push(impTx);
                    });
                    
                    // Impor tagihan
                    if (imported.bills) {
                        imported.bills.forEach(impBill => {
                            const exists = db.bills.some(b => b.id === impBill.id);
                            if (!exists) db.bills.push(impBill);
                        });
                    }
                    
                    // Impor inventaris
                    if (imported.inventory) {
                        imported.inventory.forEach(impInv => {
                            const exists = db.inventory.some(i => i.id === impInv.id);
                            if (!exists) db.inventory.push(impInv);
                        });
                    }
                    
                    saveDatabase();
                    showToast("Database berhasil diimpor & dipulihkan!", "success");
                    
                    // Reset input & segarkan halaman
                    event.target.value = "";
                    
                    if (db.currentUser) {
                        initDashboard();
                    } else {
                        location.reload();
                    }
                }
            } else {
                showToast("File tidak sesuai format backup TMaal!", "danger");
            }
        } catch (err) {
            console.error(err);
            showToast("Gagal membaca file backup JSON. File rusak!", "danger");
        }
    };
    reader.readAsText(file);
}


// KELUAR & RESET SISTEM

// 1. Keluar dari Akun Aktif
function logoutCurrentUser() {
    db.currentUser = null;
    saveDatabase();
    showToast("Anda telah keluar dari aplikasi.", "success");
    navigateTo("login");
}

// 2. Hapus total database dari localStorage (Danger)
function resetAppDatabase() {
    const doubleConfirm = confirm("PERINGATAN KERAS! Anda akan menghapus SELURUH database akun, riwayat keuangan, tagihan, dan aset di browser ini secara permanen.\n\nApakah Anda benar-benar yakin?");
    if (!doubleConfirm) return;
    
    const tripleConfirm = confirm("Tindakan ini tidak bisa dibatalkan! Ketik 'HAPUS DATABASE' untuk mengonfirmasi.");
    if (tripleConfirm) {
        // Clear localStorage
        localStorage.removeItem("tmaal_db");
        showToast("Database offline berhasil dibersihkan. Memulai ulang...", "success");
        setTimeout(() => {
            location.reload();
        }, 1500);
    }
}


// UTILITAS PEMBANTU (HELPERS)

// 1. Format nominal Rupiah
function formatRupiah(value) {
    const number = parseFloat(value);
    if (isNaN(number)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(number);
}

// 2. Escaping HTML untuk keamanan XSS
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
