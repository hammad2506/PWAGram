const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
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
  const url = 'https://httpbin.org/get';

  if (event.request.url.includes(url)) { //if the request is for fetching cards we will respond via network and cache the card
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
      .then(function (cache) {
        return fetch(event.request)
          .then(function (res) {
            cache.put(event.request, res.clone())
            return res;
          })
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
