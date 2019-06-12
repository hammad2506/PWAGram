const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require('./firebase-key/pwagram-key.json');

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
       return response.status(201).json({message: 'Data Stored', id: request.body.id});
     })
     .catch((err) => {
       response.status(500).json({error: err});
     });
 });
});
