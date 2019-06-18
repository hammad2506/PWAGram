module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,css}",
    "src/images/*.{jpg,png}",
    "src/js/*.js"
  ],
  "swDest": "public/service-worker.js",
  "swSrc": "public/sw-base.js",
  "globIgnores": [
    "../workbox-config.js",
    "help/**",
    "404.html",
    "public/sw.js"
  ]
};