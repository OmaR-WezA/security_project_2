import bcrypt from 'bcrypt';
import forge from 'node-forge';

const SALT_ROUNDS = 10;

// Password Hashing
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// RSA Key Generation
export const generateKeyPair = () => {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
    return { publicKeyPem, privateKeyPem };
};

// RSA Encryption
export const encryptMessage = (publicKeyPem, message) => {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(message, 'RSA-OAEP');
    return forge.util.encode64(encrypted);
};

// RSA Decryption
export const decryptMessage = (privateKeyPem, ciphertext) => {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decoded = forge.util.decode64(ciphertext);
    const decrypted = privateKey.decrypt(decoded, 'RSA-OAEP');
    return decrypted;
};
