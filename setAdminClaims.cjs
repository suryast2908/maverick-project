const admin = require("firebase-admin");

// Load your service account JSON file
const serviceAccount = require("C:/Users/prem1/Downloads/mavericks-coding-platform (1)/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://falcons-mavericks-platform-default-rtdb.asia-southeast1.firebasedatabase.app"
});

async function setClaims() {
  const uids = [
    "X9MCx8q6fsSlCLl0sIutHlrrPTu1",
    "RSlLx3YvWOhtR83kj8QB0zyMzHM2",
    "z290kTfY7KXxgNm4L9UPNKj1u482"
  ];
  for (const uid of uids) {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Admin claim set for ${uid}`);
  }
}

setClaims().then(() => process.exit(0));
