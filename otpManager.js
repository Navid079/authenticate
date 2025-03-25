function base32_encode(data) {
  // Define the Base32 alphabet
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  // Convert the input Uint8Array to binary
  const binary_data = Array.from(data)
    .map(byte => byte.toString(2).padStart(8, "0"))
    .join("");

  // Pad the binary data with zeros if necessary
  let padded_binary_data = binary_data;
  while (padded_binary_data.length % 5 !== 0) {
    padded_binary_data += "0";
  }

  // Split the binary data into 5-bit chunks
  const chunks = [];
  for (let i = 0; i < padded_binary_data.length; i += 5) {
    chunks.push(padded_binary_data.slice(i, i + 5));
  }

  // Convert each 5-bit chunk to its corresponding Base32 character
  const encoded_data = chunks
    .map(chunk => alphabet[parseInt(chunk, 2)])
    .join("");

  return encoded_data;
}

function encryptAndSaveOTPs(otps) {
  const encryptedData = passwordSafe.encrypt(otps);
  localStorage.setItem("otps", encryptedData);
}

function displayOTPs(otps) {
  const otpDisplay = document.getElementById("otpDisplay");
  otpDisplay.innerHTML = ""; // Clear previous entries

  otps.forEach(otp => {
    const otpElement = document.createElement("div");
    otpElement.className =
      "p-4 bg-gray-50 rounded-md shadow-md flex flex-col items-center cursor-pointer";
    otpElement.innerHTML = `
            <div class="text-lg font-semibold">${otp.name}</div>
            <div class="text-sm text-gray-500">${otp.issuer}</div>
            <div class="text-2xl font-bold mt-2" id="otp-${otp.name}">...</div>
            <div class="text-sm text-gray-500 mt-1" id="time-${otp.name}">...</div>
          `;
    otpElement.onclick = () => copyToClipboard(otp.name);
    otpDisplay.appendChild(otpElement);
  });

  updateOTPs(otps);
  setInterval(() => updateOTPs(otps), 1000);
}

function updateOTPs(otps) {
  const otpLib = otplib.authenticator;
  const algorithms = [
    "ALGORITHM_TYPE_UNSPECIFIED",
    "SHA1",
    "SHA256",
    "SHA512",
    "MD5",
  ];

  otps.forEach(otp => {
    otpLib.options = {
      digits: otp.digits,
      algorithm: algorithms[+otp.algorithm],
    };
    const otpCode = otpLib.generate(otp.secret);
    const remainingTime = otpLib.timeRemaining();

    document.getElementById(`otp-${otp.name}`).textContent = otpCode;
    document.getElementById(
      `time-${otp.name}`
    ).textContent = `Expires in ${remainingTime}s`;
  });
}

async function importQRCode() {
  const input = document.getElementById("qrInput");
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function () {
      const qr = new QrCode();
      qr.callback = async function (err, value) {
        if (err) {
          alert("Error reading QR code");
          return;
        }
        const uri = value.result;
        if (uri.startsWith("otpauth-migration://")) {
          await importFromMigrationURI(uri);
        } else {
          alert("Unsupported QR code format.");
        }
      };
      qr.decode(img.src);
    };
  };
  reader.readAsDataURL(file);
}

async function importFromMigrationURI(uri) {
  const dataParam = new URLSearchParams(uri.split("?")[1]).get("data");
  if (!dataParam) {
    alert("Invalid migration URI.");
    return;
  }

  const decodedData = Uint8Array.from(atob(dataParam), c =>
    c.charCodeAt(0)
  );

  const root = await protobuf.load(
    "https://raw.githubusercontent.com/qistoph/otp_export/refs/heads/master/OtpMigration.proto"
  );
  const MigrationPayload = root.lookupType("MigrationPayload");

  const message = MigrationPayload.decode(new Uint8Array(decodedData));
  const newOTPs = message.otpParameters.map(otp => ({
    secret: base32_encode(otp.secret),
    name: otp.name,
    issuer: otp.issuer || "Unknown",
    algorithm: otp.algorithm || "SHA1",
    digits: otp.digits === 2 ? 8 : 6,
    type: otp.type === 1 ? "HOTP" : "TOTP",
    counter: otp.counter || 0,
  }));

  const encryptedOTPs = localStorage.getItem("otps");

  const existingOTPs = encryptedOTPs
    ? JSON.parse(passwordSafe.decrypt(encryptedOTPs))
    : [];
  const combinedOTPs = [...existingOTPs, ...newOTPs];

  encryptAndSaveOTPs(combinedOTPs);
  displayOTPs(combinedOTPs);
}

function importState() {
  const input = document.getElementById("importFile");
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const encryptedData = e.target.result;
      const decryptedData = passwordSafe.decrypt(encryptedData);
      const otps = JSON.parse(decryptedData);

      encryptAndSaveOTPs(otps);
      displayOTPs(otps);
      alert("State imported successfully!");
    } catch (err) {
      alert(
        "Failed to import state. Ensure the file is valid and the password is correct."
      );
    }
  };
  reader.readAsText(file);
}

function exportState() {
  const encryptedOTPs = localStorage.getItem("otps");
  if (!encryptedOTPs) {
    alert("No state to export.");
    return;
  }

  const blob = new Blob([encryptedOTPs], {
    type: "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "state.dat";
  a.click();

  URL.revokeObjectURL(url);
  alert("State exported successfully!");
}