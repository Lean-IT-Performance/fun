// Configuration FTP - Copiez ce fichier en deploy-env.js et modifiez vos informations

module.exports = {
    host: 'votre-serveur-ftp.com',
    user: 'votre-username',
    password: 'votre-password',
    secure: false, // true pour FTPS/SFTP
    port: 21       // 22 pour SFTP
};