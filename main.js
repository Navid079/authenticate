document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("otps")) showPasswordModal();
  else promptForPassword();
});
