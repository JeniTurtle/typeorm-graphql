import * as bcryptTools from 'bcrypt';
import * as CryptoJS from 'crypto-js';

export const bcrypt = {
  saltRounds: 10,
  hash: (password: string) => {
    return bcryptTools.hashSync(password, bcrypt.saltRounds);
  },
  compare: (password: string, EncryptedPassword: string) => {
    return bcryptTools.compareSync(password, EncryptedPassword);
  },
};

export const crypto = {
  keyStr: 'k;)*(+nmjdsf$#@d',
  encrypt(word) {
    const key = CryptoJS.enc.Utf8.parse(this.keyStr);
    const srcs = CryptoJS.enc.Utf8.parse(word);
    return CryptoJS.AES.encrypt(srcs, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
  },
  decrypt(word) {
    const key = CryptoJS.enc.Utf8.parse(this.keyStr);
    return CryptoJS.AES.decrypt(word, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
  },
};
