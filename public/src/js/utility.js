const dbPromise = idb.open('posts-store', 1, function(db){
    if(!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {keyPath: 'id'});
    }
    if(!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', {keyPath: 'id'});
    }
});

function writeData(st, data) {
    return dbPromise
    .then(function(db) {
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.put(data);
        return tx.complete;
    });
}

function readAllData(st){
    return dbPromise
    .then(function(db){
        const tx = db.transaction(st, 'readonly');
        const store = tx.objectStore(st);
        return store.getAll();
    });
}

function clearAllData(st){
    return dbPromise
    .then(function(db){
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.clear();
        return tx.complete;
    });
}

function deleteItemFromData(st, id){
    return dbPromise
    .then(function(db){
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.delete(id);
        return tx.complete;
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
   
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
   
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  }

  function reverseGeocoding(lat, lng) {
    return new Promise((res, rej) => {
    fetch(`https://us1.locationiq.com/v1/reverse.php?key=${LOCATION_IQ_API_KEY}&lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(response => {
        console.log(response);
        if (response.address.name && response.address.city) {
          return response.address.name + ", " + response.address.city;
        } else if (response.address.road && response.address.city) {
          return response.address.road + ", " + response.address.city;
        } else if (response.address.city && response.address.country) {
          return response.address.city + ", " + response.address.country;
        } else if (response.country || response.address.country){
          return response.country || response.address.country;
        } else {
          return "location unknown"
        }
      })
      .then((location) => res(location))
    });
  }