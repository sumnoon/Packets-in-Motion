/* ---------------- 1. CLIENT–SERVER: put the page load in order ---------------- */
chal('client-server',{title:'Load the page',goal:'Put the six steps of opening a website in the right order.',
  hint:'Before anything else, the browser needs an address. Then it needs a connection, a secure one, and only then can it ask.',
  make:orderGame({head:'You type example.com and press Enter. What happens, in order?',msg:'Name → address → connection → secure channel → ask → answer → draw. That is every page load.',
    steps:[{t:'DNS lookup',sub:'name → IP'},{t:'TCP handshake',sub:'SYN · SYN-ACK · ACK'},{t:'TLS handshake',sub:'agree on keys'},{t:'HTTP request',sub:'GET /'},{t:'HTTP response',sub:'200 OK + HTML'},{t:'Render',sub:'draw the page'}]})});
