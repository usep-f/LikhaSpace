const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envConfig = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2];
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    envConfig[match[1]] = val;
  }
});

const privateKey = envConfig.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: envConfig.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: envConfig.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });
}

const db = getFirestore();

async function patch() {
  const snapshot = await db.collection('gigs').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.title === 'Custom Website') {
      await db.collection('gigs').doc(doc.id).update({ rating: 5.0, reviewsCount: 1 });
      console.log('Patched Custom Website gig!');
    }
  }
}
patch().catch(console.error);
