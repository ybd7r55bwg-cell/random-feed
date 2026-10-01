var CACHE="random-feed-v2";
var ASSETS=["./","./index.html","./manifest.json",
            "./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png"];

self.addEventListener("install",function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate",function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET") return;
  var req=e.request;
  var isDoc = req.mode==="navigate" || req.destination==="document";

  if(isDoc){
    e.respondWith(
      fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){ c.put(req,copy); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status===200){
          var copy=res.clone();
          caches.open(CACHE).then(function(c){ c.put(req,copy); });
        }
        return res;
      });
    })
  );
});
