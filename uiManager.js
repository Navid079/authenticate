function showPasswordModal() {
  const modal = document.createElement("div");
  modal.id = "passwordModal";
  modal.className =
    "fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center";
  modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-lg font-bold mb-4">Enter a Password</h2>
        <input
          type="password"
          id="passwordInput"
          class="w-full p-2 border rounded-md mb-4"
          placeholder="Enter a password"
        />
        <button
          class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          onclick="setPassword()"
        >
          Submit
        </button>
      </div>
    `;
  document.body.appendChild(modal);
}

function setPassword() {
  const password = document.getElementById("passwordInput").value;
  if (!password) {
    alert("Password cannot be empty.");
    return;
  }
  passwordSafe.setPass(password);

  encryptAndSaveOTPs([]);
  document.getElementById("passwordModal").remove();
  displayOTPs([]);
}

function promptForPassword() {
  const modal = document.createElement("div");
  modal.id = "passwordPromptModal";
  modal.className =
    "fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center";
  modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-lg font-bold mb-4">Enter Your Password</h2>
        <input
          type="password"
          id="passwordInput"
          class="w-full p-2 border rounded-md mb-4"
          placeholder="Enter your password"
        />
        <button
          class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          onclick="verifyPassword()"
        >
          Submit
        </button>
      </div>
    `;
  document.body.appendChild(modal);
}

function verifyPassword() {
  const password = document.getElementById("passwordInput").value;
  if (!password) {
    alert("Password cannot be empty.");
    return;
  }

  passwordSafe.setPass(password);

  const encryptedOTPs = localStorage.getItem("otps");
  if (!encryptedOTPs) {
    alert("No OTPs found.");
    return;
  }

  try {
    const decryptedData = passwordSafe.decrypt(encryptedOTPs);
    const otps = JSON.parse(decryptedData);
    document.getElementById("passwordPromptModal").remove();
    displayOTPs(otps);
  } catch (err) {
    alert("Wrong password or corrupted data.");
  }
}

function copyToClipboard(otpName) {
  const otpCode = document.getElementById(`otp-${otpName}`).textContent;
  navigator.clipboard
    .writeText(otpCode)
    .then(() => {
      alert(`OTP code "${otpCode}" copied to clipboard!`);
    })
    .catch(err => {
      alert("Failed to copy OTP code to clipboard.");
      console.error(err);
    });
}
