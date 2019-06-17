const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
const sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerArea = document.querySelector('#pick-image');
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');

let picture = null;
const fetchedLocation = {
  lat: 0,
  lng: 0
};

locationBtn.addEventListener('click', function (event) {
  if (!('geolocation' in navigator)) {
    return;
  }
  let sawAlert = false;

  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition(function (position) {
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';

    fetchedLocation.lat = position.coords.latitude,
    fetchedLocation.lng = position.coords.longitude

    reverseGeocoding(fetchedLocation.lat, fetchedLocation.lng)
      .then((geocodedLocation) => {
        locationInput.value = geocodedLocation;
        document.querySelector('#manual-location').classList.add('is-focused')
      })
      .catch(err => {
        console.log(err);
        locationInput.value = "location unknown";
        document.querySelector('#manual-location').classList.add('is-focused')
      })

  }, function (err) {
    console.log(err);
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    if (!sawAlert) {
      alert('Couldn\'t fetch location, please enter manually!');
      sawAlert = true;
    }
    
    fetchedLocation.lat = position.coords.latitude,
    fetchedLocation.lng = position.coords.longitude

  }, {
    timeout: 7000
  });
});

function initializeLocation() {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
  }
}


function initializeMedia() {
  if (!('mediaDevices in navigator')) {
    navigator.mediaDevices = {};
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }

      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

  navigator.mediaDevices.getUserMedia({
      video: true
    })
    .then(function (stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(function (err) {
      imagePickerArea.style.display = 'block';
    });
}

captureButton.onclick = function (event) {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';

  const context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));

  videoPlayer.srcObject.getVideoTracks().forEach(function (track) { //close video stream
    track.stop();
  });

  picture = dataURItoBlob(canvasElement.toDataURL()); //convert picture to blob
};

imagePicker.onchange = function (event) { //uploading picture from local directory
  picture = event.target.files[0];
};

function openCreatePostModal() {
  setTimeout(function () {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);

  initializeMedia();
  initializeLocation();

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function(registrations) {
  //       for (var i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureButton.style.display = 'inline';

  titleInput.value = '';
  locationInput.value = '';
  fetchedLocation.lat = 0;
  fetchedLocation.lng = 0;
  picture = null;

  if (videoPlayer.srcObject) { //close video stream
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
  }
  setTimeout(function () {
    createPostArea.style.transform = 'translateY(100vh)';
  }, 1);
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  const cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url(${data.image})`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  const cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  const cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // const cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

const url = 'https://pwagram-34724.firebaseio.com/posts.json';
let networkDataReceived = false;

function updateUI(data) {
  clearCards();
  if (!data) {
    return;
  }

  data.forEach(cardData => {
    createCard(cardData);
  });
}

function postsObjectToArray(posts) {
  const postsArray = [];
  for (post in posts) {
    postsArray.push(posts[post]);
  }
  return postsArray;
}

fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    const postsArray = postsObjectToArray(data);
    updateUI(postsArray);
  });


if ('indexedDB' in window) {
  readAllData('posts')
    .then(function (data) {
      if (!networkDataReceived) {
        updateUI(data);
      }
    })

}

function sendPostData(title, location, rawLocation, pictureBlob) {
  console.log("sending data");
  const id = new Date().toISOString();
  const postData = new FormData();
  postData.append('id', id);
  postData.append('title', title);
  postData.append('location', location);
  postData.append('rawLocationLat', rawLocation.lat);
  postData.append('rawLocationLng', rawLocation.lng);
  postData.append('file', pictureBlob, id + '.png');

  fetch('https://us-central1-pwagram-34724.cloudfunctions.net/storePostData', {
      method: 'POST',
      body: postData
    })
    .then(function (res) {
      console.log('Sent data', res);
      updateUI();
    })
    .catch(function (err) {
      console.log("Error in posting data", err);
    });
}

form.addEventListener('submit', function (event) {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '' || picture === null) {
    alert("Title, Location or Picture cannot be empty");
    return;
  }

  const title = titleInput.value;
  const location = locationInput.value;
  const rawLocation = {};
  rawLocation.lat = fetchedLocation.lat;
  rawLocation.lng = fetchedLocation.lng;
  const pictureBlob = picture;

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function (sw) {
        const post = {
          id: new Date().toISOString(),
          title: title,
          location: location,
          picture: pictureBlob,
          rawLocation: rawLocation
        };
        writeData('sync-posts', post)
          .then(function () {
            return sw.sync.register('sync-new-posts');
          })
          .then(function () {
            const snackbarContainer = document.querySelector('#confirmation-toast');
            const data = {
              message: 'Your Post was saved for syncing!'
            };
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function (err) {
            console.log('In syncManager ', err);
          });
      });
  } else {
    sendPostData(title, location, rawLocation, pictureBlob);
  }
});

//TO UNregister all SW
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations()
//     .then(function(registrations) {
//       for (var i = 0; i < registrations.length; i++) {
//         registrations[i].unregister();
//       }
//     })
// }