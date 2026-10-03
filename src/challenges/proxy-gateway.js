/* ---------------- 4. GATEWAY: route by path ---------------- */
chal('proxy-gateway',{timed:true,title:'Run the gateway',goal:'Route each request to the right service, and reject anything without a valid token. You have 7 seconds per request.',
  hint:'/users → Users, /orders → Orders, /static → Static files (public, no token needed). Private paths without a valid token → 401.',
  make:sortGame({timer:7,bins:[{id:'u',label:'Users service',sub:'/users/*',c:C.blue},{id:'o',label:'Orders service',sub:'/orders/*',c:C.green},{id:'s',label:'Static files',sub:'/static/* · public',c:C.amber},{id:'x',label:'Reject 401',sub:'no valid token',c:C.red}],
    cards:[{t:'GET /users/42 · valid token',b:'u',why:'/users paths go to the Users service.'},{t:'GET /static/logo.png',b:'s',why:'Static files are public, so no token is needed.'},{t:'POST /orders · valid token',b:'o',why:'/orders goes to Orders.'},
      {t:'DELETE /users/7 · no token',b:'x',why:'A private path without a token is rejected at the gateway, before any service sees it.'},{t:'GET /orders/981 · valid token',b:'o',why:'/orders/… goes to Orders.'},
      {t:'GET /static/app.js',b:'s',why:'Everything under /static is served as a file.'},{t:'PUT /users/42/avatar · valid token',b:'u',why:'Still a /users path.'},
      {t:'GET /orders/981 · expired token',b:'x',why:'An expired token is not valid. Reject it.'},{t:'GET /users/me · no token',b:'x',why:'No token, no entry.'},{t:'PATCH /orders/12 · valid token',b:'o',why:'/orders goes to Orders.'}]})});
