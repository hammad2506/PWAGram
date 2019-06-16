const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const webpush = require('web-push');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require('./firebase-key/pwagram-key.json');
const vapidPrivateKey = require('./firebase-key/vapid-private-key');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-34724.firebaseio.com'
  });

exports.storePostData = functions.https.onRequest((request, response) => {
 cors(request, response, () => {
     admin.database().ref('posts').push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image
     })
     .then(() => {
      webpush.setVapidDetails('mailto:hammad2506@gmail.com', 'BE2_knRR6z2W3GsjTC4Uw8yjteCg8ijwbMVwQ8t1OUd_pKFuwDjgpif4PJSpx8ehx-D3ThOweBcgPE7QqQENjz0', vapidPrivateKey);
      return admin.database().ref('subscriptions').once('value');
    })
     .then((subscriptions) => {
      subscriptions.forEach((sub) => {
        const pushConfig = {
          endpoint: sub.val().endpoint,
          keys: {
            auth: sub.val().keys.auth,
            p256dh: sub.val().keys.p256dh
          }
        };

        webpush.sendNotification(pushConfig, JSON.stringify({
          title: 'New Post',
          content: 'New Post added!',
          openUrl: '/help'
        }))
      });
      return response.status(201).json({message: 'Data stored', id: request.body.id});
    })
     .catch((err) => {
       response.status(500).json({error: err});
     });
 });
});
