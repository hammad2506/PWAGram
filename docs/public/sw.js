importScripts('/src/js/idb.js');
importScripts('/src/js/idb-utils.js');

const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/idb.js',
  '/src/js/idb-utils.js',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', function (event) {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
    .then(function (cache) {
      console.log('Precaching App shell');
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', function (event) {
  console.log('Service Worker activating')
  event.waitUntil(
    caches.keys()
    .then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
          console.log('Deleting old cache', key);
          return caches.delete(key);
        }
      }))
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const url = 'https://pwagram-34724.firebaseio.com/posts.json';

  if (event.request.url.includes(url)) { //if the request is for fetching cards we will respond with network and update the IDB with fresh posts (clearing it first) 
    event.respondWith(fetch(event.request)
      .then(function (res) {
        const clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            for (let key in data) {
              writeData('posts', data[key]);
            }
          })
        return res;
      })
    );
  } else if (isInArray(event.request.url, CACHE_STATIC_NAME)) { //check is request is for one of our static files, then just serve from cache, no network request required
    event.respondWith(
      caches.match(event.request)
    );
  } else { //for all other request (not static, and not card fetching), respond with cache, if not, do a network request then respond and cache
    event.respondWith(
      caches.match(event.request)
      .then(function (response) { //if data in cache, respond with cache
        if (response) {
          return response;
        } else { //if data not in cache, request via network, then cache 
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function (cache) {
                  cache.put(event.request.url, res.clone());
                  return res;
                })
            })
            .catch(function (err) { // on error, if page requested was html, respond with our cached offline page
              return caches.open(CACHE_STATIC_NAME)
                .then(function (cache) {
                  if (event.request.headers.get('accept').includes('text/html')) {
                    return cache.match('/offline.html');
                  }
                })
            });
        }
      })
    );
  }

});

//Background Sync

self.addEventListener('sync', function (event) {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts')
      .then(function (data) {
        for (const dt of data) {
          fetch('https://us-central1-pwagram-34724.cloudfunctions.net/storePostData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-34724.appspot.com/o/sf-boat.jpg?alt=media&token=5be32d7c-bfe0-46b0-9eda-3dc1e7fcf67b'
              })
            })
            .then(function (res) {
              console.log('Sent data', res);
              if (res.ok) {
                res.json()
                .then(function(resData) {
                  deleteItemFromData('sync-posts', resData.id);
                });
              }
            })
            .catch(function (err) {
              console.log('Error while sending data', err);
            });
        }
      })
    );
  }
});

//helper functions

//Checks to see if provided string is part of the provided array. If the asset is from the same domain, we only use the substring following our domain
function isInArray(string, array) {
  let cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length);
  } else {
    cachePath = string;
  }
  return array.includes(cachePath);
}

// function trimCache(cacheName, maxItems) { //Use this to set a max number of items in the passed cacheName. Deletes all old entries first
//   caches.open(cacheName)
//     .then(function (cache) {
//       return cache.keys()
//         .then(function (keys) {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems))
//           }
//         });
//     })
// }
