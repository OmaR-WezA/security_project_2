// API Configuration
const API_BASE = 'http://localhost:3000/api';

// State Management
let currentUser = null;
let selectedUser = null;
let privateKey = null;
let pendingRegCredentials = null; // Store credentials during registration
const sentMessagesCache = new Map(); // Local cache for the current session to show sent plaintext

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userList = document.getElementById('user-list');
const messageList = document.getElementById('message-list');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const keyModal = document.getElementById('key-modal');
const privateKeyDisplay = document.getElementById('private-key-display');
const copyKeyBtn = document.getElementById('copy-key-btn');
const downloadKeyBtn = document.getElementById('download-key-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const logoutBtn = document.getElementById('logout-btn');
const displayUsername = document.getElementById('display-username');

// --- Library Check ---
if (typeof forge === 'undefined') {
    console.error('Forge library failed to load!');
    setTimeout(() => showToast('Error: Cryptography library (forge) not loaded. Please refresh.', 'error'), 1000);
}

// Ensure modal is hidden and App Section is hidden on fresh load
keyModal.classList.add('hidden');
keyModal.style.display = 'none';
appSection.classList.add('hidden');
authSection.classList.remove('hidden');

// --- Tab Switching ---
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    });
});

// --- Authentication ---

async function performLogin(username, password) {
    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    currentUser = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Try to load key automatically
    const savedKey = localStorage.getItem(`pkey_${currentUser.id}`) || localStorage.getItem(`temp_pkey_${username}`);
    if (savedKey) {
        privateKey = savedKey;
        localStorage.setItem(`pkey_${currentUser.id}`, savedKey);
        localStorage.removeItem(`temp_pkey_${username}`);
    }

    showApp();
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        privateKey = null;

        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        privateKeyDisplay.innerText = data.privateKey;
        localStorage.setItem(`temp_pkey_${username}`, data.privateKey);

        // Store credentials so we can login after they close the modal
        pendingRegCredentials = { username, password };

        // Change button text to indicate next step
        closeModalBtn.innerText = 'Continue to Chat';

        keyModal.style.display = 'flex';
        keyModal.classList.remove('hidden');

        showToast('Account created! Copy/Save your key to continue.', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        await performLogin(username, password);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Vault Toggle Logic
window.toggleVault = () => {
    if (privateKey) {
        privateKey = null;
        showToast('Chat Locked (Privacy Mode)', 'info');
    } else {
        const savedKey = localStorage.getItem(`pkey_${currentUser.id}`);
        if (savedKey) {
            privateKey = savedKey;
            showToast('Chat Unlocked!', 'success');
        } else {
            enterPrivateKey();
        }
    }
    updateKeyStatus();
    loadMessages();
};

window.enterPrivateKey = () => {
    const key = prompt('Please paste your Private Key to unlock:');
    if (key && key.includes('PRIVATE KEY')) {
        privateKey = key;
        localStorage.setItem(`pkey_${currentUser.id}`, key);
        updateKeyStatus();
        loadMessages();
        showToast('Private key activated!', 'success');
    } else if (key) {
        showToast('Invalid Private Key format', 'error');
    }
};

function updateKeyStatus() {
    const statusEl = document.getElementById('key-status');
    if (!statusEl) return;

    if (privateKey) {
        statusEl.innerHTML = '<span class="badge success clickable" onclick="toggleVault()">Key: Active 🔓</span>';
    } else {
        statusEl.innerHTML = '<span class="badge error clickable" onclick="toggleVault()">Key: Locked 🔒</span>';
    }
}

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    displayUsername.textContent = currentUser.username;
    updateKeyStatus();
    loadUsers();

    keyModal.style.display = 'none';
    keyModal.classList.add('hidden');
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    privateKey = null;
    appSection.classList.add('hidden');
    authSection.classList.remove('hidden');
    document.getElementById('user-info').classList.add('hidden');
});

// --- Messaging ---

async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE}/users`);
        const users = await res.json();

        userList.innerHTML = users
            .filter(u => u.id !== currentUser.id)
            .map(u => `
                <li class="user-item" onclick="selectUser(${JSON.stringify(u).replace(/"/g, '&quot;')})">
                    <div class="user-avatar">${u.username[0].toUpperCase()}</div>
                    <div class="user-name">${u.username}</div>
                </li>
            `).join('');
    } catch (err) {
        console.error('Failed to load users');
    }
}

window.selectUser = (user) => {
    selectedUser = user;
    document.getElementById('no-chat-selected').classList.add('hidden');
    document.getElementById('chat-active').classList.remove('hidden');
    document.getElementById('current-chat-user').textContent = user.username;

    document.querySelectorAll('.user-item').forEach(el => {
        if (el.innerText.includes(user.username)) el.classList.add('active');
        else el.classList.remove('active');
    });

    loadMessages();
};

async function loadMessages() {
    if (!selectedUser) return;
    try {
        const res = await fetch(`${API_BASE}/messages/${currentUser.id}`);
        const messages = await res.json();

        const filtered = messages.filter(m => m.sender_id === selectedUser.id || m.receiver_id === selectedUser.id);

        messageList.innerHTML = filtered.map(m => {
            const isSent = m.sender_id === currentUser.id;
            let displayContent = isSent ? (sentMessagesCache.get(m.id) || '[Your Secure Message]') : '[Encrypted]';

            if (!isSent) {
                if (privateKey) {
                    try {
                        displayContent = decryptRSA(privateKey, m.ciphertext);
                    } catch (e) {
                        displayContent = '<span class="error-text">[Decryption Failed - Wrong Key]</span>';
                    }
                } else {
                    displayContent = '<span class="lock-hint" onclick="toggleVault()">🔒 Click to Unlock with Private Key</span>';
                }
            }

            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="content">${displayContent}</div>
                    <div class="ciphertext">Cipher: ${m.ciphertext.substring(0, 30)}...</div>
                </div>
            `;
        }).join('');

        messageList.scrollTop = messageList.scrollHeight;
    } catch (err) {
        console.error('Failed to load messages');
    }
}

sendBtn.addEventListener('click', async () => {
    const text = messageInput.value.trim();
    if (!text || !selectedUser) return;

    try {
        if (!selectedUser.public_key) throw new Error("Recipient public key not found");

        const ciphertext = encryptRSA(selectedUser.public_key, text);

        const res = await fetch(`${API_BASE}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: currentUser.id,
                receiverId: selectedUser.id,
                ciphertext: ciphertext
            })
        });

        if (!res.ok) throw new Error("Server error - Failed to send");

        const result = await res.json();
        if (result.id) {
            sentMessagesCache.set(parseInt(result.id), text);
        }

        messageInput.value = '';
        loadMessages();
    } catch (err) {
        console.error('Send error:', err);
        showToast(err.message, 'error');
    }
});

// --- RSA Utilities ---

function encryptRSA(publicKeyPem, text) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const buffer = forge.util.createBuffer(text, 'utf8');
    const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP');
    return forge.util.encode64(encrypted);
}

function decryptRSA(privateKeyPem, ciphertext) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decoded = forge.util.decode64(ciphertext);
    const decrypted = privateKey.decrypt(decoded, 'RSA-OAEP');
    return forge.util.decodeUtf8(decrypted);
}

// --- UI Utilities ---

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    const container = document.getElementById('toast-container');
    if (container) container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

copyKeyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const key = privateKeyDisplay.innerText;

    // Robust Copy Method
    const el = document.createElement('textarea');
    el.value = key;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    showToast('Private key copied!', 'success');
});

if (downloadKeyBtn) {
    downloadKeyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = privateKeyDisplay.innerText;
        const blob = new Blob([key], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `private_key_secure_messenger.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Key downloaded!', 'success');
    });
}

closeModalBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // If we have pending registration login, do it now
    if (pendingRegCredentials) {
        const { username, password } = pendingRegCredentials;
        pendingRegCredentials = null;
        closeModalBtn.innerText = 'Got it'; // Reset for next time
        performLogin(username, password).catch(err => showToast(err.message, 'error'));
    } else {
        keyModal.style.display = 'none';
        keyModal.classList.add('hidden');
    }
});

// Auto-login logic
const savedUser = localStorage.getItem('user');
if (savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
        privateKey = localStorage.getItem(`pkey_${currentUser.id}`);
        showApp();
    } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}
