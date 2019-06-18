Workbox CLI Setup;

1- Install workbox globally:
<br /> 
````    npm i workbox-cli --global````
<br /> 
<br /> 
2- Run to initialzie workbox and follow instructions (save in public or dist folder): 
<br /> 
````    workbox wizard````
<br /> 
<br /> 
3- Generate workbox Service Worker (Our config file is workbox-config.js)
<br /> 
````    workbox generateSW workbox-config.js````
<br /> 
<br /> 
4-Create a new service worker file (sw-base.js) and copy the sw import statement from the sw created in (3) and also copy the following line:
<br /> 
````    importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");````
<br />
````    workbox.precaching.precacheAndRoute([]);````
<br /> 
<br />
5- Use workbox wizard to inject manifest (use sw-base as src and sw created in (3) as dest):
<br /> 
````    workbox wizard --injectManifest````
<br /> 
<br /> 
6- Do all your work in sw-base.js and once ready to update, use the following command:
<br /> 
````    workbox injectManifest workbox-config.js````
<br /> 
<br /> 
<br /> 
<br /> 
Highly adivse to use the webpack-plugin!!