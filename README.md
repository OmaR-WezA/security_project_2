# Secure Messaging Application V2 - Project Documentation

This project is a high-security messaging web application built for the Security Two Assignment. It demonstrates advanced cryptographic concepts including password hashing and asymmetric encryption.

## Features
- **User Registration**: Secure account creation with local RSA key generation.
- **Password Security**: Passwords are never stored in plaintext; they are hashed using **bcrypt**.
- **RSA Encryption**: Messages are encrypted end-to-end using the receiver's **RSA-2048 Public Key**.
- **Modern UI**: A premium glassmorphic dark-themed interface built with vanilla CSS.

## Technology Stack
- **Backend**: Node.js, Express, MySQL.
- **Frontend**: Plain HTML5, Vanilla CSS3, JavaScript (ES6+).
- **Libraries**:
  - `bcrypt`: For secure password hashing.
  - `node-forge`: For RSA cryptographic operations (generation, encryption, decryption).
  - `mysql2`: For efficient database interaction.

## How to Run

### 1. Database Setup
1. Ensure MySQL is running on your machine.
2. The application will automatically create the `secure_messaging_v2` database and necessary tables on startup.
3. Check `.env` for database credentials (default: `root` with no password).

### 2. Installation
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
The server will run on `http://localhost:5000`.

### 4. Open the App
Since this version uses a modern single-page structure, you can serve the `frontend` folder using any static server or simply open the `index.html` (though a server like Vite or Live Server is recommended for the best experience).

## Implementation Details

### Password Hashing (Bcrypt)
We use `bcrypt` with 10 salt rounds to hash passwords before storing them. This protects against rainbow table and brute-force attacks.
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

### Messaging Encryption (RSA)
We implemented Option B: **Asymmetric Encryption**.
1. **Key Generation**: When a user registers, an RSA-2048 key pair is generated using `node-forge`.
2. **Encryption**: Before sending a message, the client fetches the recipient's public key and encrypts the message locally.
3. **Decryption**: The recipient uses their private key (stored locally or entered upon login) to decrypt the ciphertext.

## Evaluation Criteria fulfilled:
- User Registration & Password Hashing: ✅
- Login Authentication: ✅
- Encryption Implementation (RSA): ✅
- Messaging Functionality: ✅
- Code Organization: ✅
