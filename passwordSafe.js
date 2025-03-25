const passwordSafe = (() => {
  let pass;
  return {
    setPass(p) {
      pass = p;
    },
    decrypt(msg) {
      return CryptoJS.AES.decrypt(msg, pass).toString(CryptoJS.enc.Utf8);
    },
    encrypt(data) {
      return CryptoJS.AES.encrypt(JSON.stringify(data), pass).toString();
    },
  };
})();
