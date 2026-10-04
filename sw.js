const C='keys-v1',F=['./','index.html','style.css','js/ui.js','js/mic.js','js/pitch.js','js/game.js','js/storage.js','lessons/index.json','lessons/01-middle-c.json','lessons/02-c-d-e.json'];
self.oninstall=e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)));
self.onfetch=e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
