/* ---------------- 4b. AUTH: pick the credential ---------------- */
chal('auth',{title:'Pick the credential',goal:'Sort each situation into the best fit: a session cookie, a short-lived JWT, or OAuth.',
  hint:'Need instant logout in one app? Sessions. Many services checking identity without a shared lookup? JWTs. Another company\'s login or API? OAuth.',
  make:sortGame({bins:[{id:'s',label:'Session cookie',sub:'server keeps the session',c:C.amber},{id:'j',label:'Short-lived JWT',sub:'signed, checked anywhere',c:C.accent},{id:'o',label:'OAuth',sub:'delegated access',c:C.green}],
    cards:[{t:'One server-rendered web app with a login form',b:'s',why:'A single app with a session store is the simplest, safest choice.'},
      {t:'Logging out must take effect at once, everywhere',b:'s',why:'Deleting the session revokes it immediately. A JWT stays valid until it expires.'},
      {t:'20 microservices check who the user is on every call',b:'j',why:'Each service verifies the signature itself, with no shared session lookup.'},
      {t:'Stateless API servers in three regions',b:'j',why:'No region needs to reach a session store elsewhere; the token carries what they need.'},
      {t:'"Log in with your work account" on a new app',b:'o',why:'The identity provider checks the password and hands the app a token.'},
      {t:'A print shop wants read access to your photos on another site',b:'o',why:'OAuth grants limited, revocable access without sharing your password.'},
      {t:'Your app must never see the user\'s password',b:'o',why:'With OAuth the password only ever goes to the identity provider.'},
      {t:'The admin panel of a small internal tool',b:'s',why:'One app, few users, instant logout: plain sessions fit.'}]})});
