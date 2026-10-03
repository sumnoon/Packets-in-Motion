/* ---------------- 4b. AUTH: pick the credential ---------------- */
chal('auth',{title:'Pick the credential',goal:'Choose session cookies, short-lived JWTs, OAuth delegated access, or OpenID Connect (OIDC) login.',
  hint:'Sessions fit revocable app login. JWTs are a token format and need claim validation. OAuth access tokens authorize APIs; OIDC adds authenticated identity through an ID token. Use authorization code flow with PKCE.',
  make:sortGame({bins:[{id:'s',label:'Session cookie',sub:'server keeps the session',c:C.amber},{id:'j',label:'Short-lived JWT',sub:'validate signature + claims',c:C.accent},{id:'o',label:'OAuth',sub:'delegated API access',c:C.green},{id:'oidc',label:'OpenID Connect',sub:'OIDC · federated login',c:C.blue}],
    cards:[{t:'One server-rendered web app with a login form',b:'s',why:'A single app with a session store is the simplest, safest choice.'},
      {t:'Logging out must take effect at once, everywhere',b:'s',why:'Deleting the session revokes it immediately. A JWT stays valid until it expires.'},
      {t:'20 microservices check who the user is on every call',b:'j',why:'Each service validates the trusted issuer, audience, expiry and signature using an allowed algorithm, with no shared session lookup.'},
      {t:'Stateless API servers in three regions',b:'j',why:'No region needs to reach a session store elsewhere; the token carries what they need.'},
      {t:'"Log in with your work account" on a new app',b:'oidc',why:'OIDC adds authentication to OAuth. Validate the ID token signature, issuer, audience, expiry and any requested nonce before accepting the identity.'},
      {t:'A print shop wants read access to your photos on another site',b:'o',why:'OAuth grants limited, revocable access without sharing your password.'},
      {t:'Federated login where the app must not handle the provider password',b:'oidc',why:'Use OIDC authorization code flow with PKCE. The access token authorizes API access; the validated ID token supplies the login identity.'},
      {t:'The admin panel of a small internal tool',b:'s',why:'One app, few users, instant logout: plain sessions fit.'}]})});
