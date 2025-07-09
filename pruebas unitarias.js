// src/utils.js

export function isAudioFile(file) {
    if (!file || !file.type) {
        return false;
    }
    return file.type.startsWith('audio/');
}

export function formatFileName(fileName) {
    if (typeof fileName !== 'string' || fileName.length === 0) {
        return '';
    }
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
        return fileName;
    }
    return fileName.substring(0, lastDotIndex);
}

export function simulateAuthLogin(success) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (success) {
                resolve("mock_user_id_123");
            } else {
                reject(new Error("Fallo de autenticación simulado"));
            }
        }, 100);
    });
}
