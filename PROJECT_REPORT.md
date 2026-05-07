# Academic Project Report: Secure Messaging Application

**Course**: Security Two
**Objective**: Implementing Cryptographic concepts in a Web Application.

## 1. Introduction
This project implements a secure messaging system where confidentiality is maintained via RSA encryption and integrity/password security via Bcrypt hashing. The application follows a modern client-server architecture with emphasizing end-to-end encryption.

## 2. Security Mechanisms

### 2.1 Password Hashing (Integrity & Confidentiality of Credentials)
We utilized the `bcrypt` library, which implements the Blowfish-based hashing algorithm. 
- **Salting**: Each password is combined with a unique salt to prevent rainbow table attacks.
- **Key Stretching**: The algorithm is intentionally slow (10 rounds) to mitigate brute-force attacks.

### 2.2 Asymmetric Encryption (Message Confidentiality)
We chose **RSA (Rivest–Shamir–Adleman)** for message security.
- **Key Pair**: Each user possesses a Public Key (stored on server) and a Private Key (kept by the user).
- **Encryption Process**: `Ciphertext = RSA_Encrypt(Recipient_Public_Key, Plaintext)`
- **Decryption Process**: `Plaintext = RSA_Decrypt(User_Private_Key, Ciphertext)`
- **Library**: `node-forge` was used for high-accuracy implementation of the RSA-OAEP padding scheme.

## 3. System Architecture

### Frontend (Client-Side)
- Handles Encryption and Decryption locally to ensure that plaintext messages never touch the server.
- Built with **Glassmorphism Design** for a premium user experience.

### Backend (Server-Side)
- **Node.js & Express**: Provides the RESTful API for user management and message relay.
- **MySQL**: Persistent storage for hashed passwords, public keys, and ciphertexts.

## 4. Conclusion
The system successfully demonstrates the practical application of cryptographic primitives. By combining slow hashing for passwords and asymmetric encryption for messages, we achieve a robust security posture suitable for academic demonstration.
