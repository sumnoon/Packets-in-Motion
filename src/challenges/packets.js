/* ---------------- 0. PACKETS: knock on the right door ---------------- */
chal('packets',{timed:true,title:'Knock on the right door',goal:'Every packet reaches the same server address. Send each one to the program it is meant for, using the port it carries.',
  hint:':443 → web server (https), :5432 → database, :53 → DNS, :22 → remote login (SSH).',
  make:sortGame({timer:8,bins:[{id:'443',label:'Web server',sub:'port 443',c:C.blue},{id:'5432',label:'Database',sub:'port 5432',c:C.green},{id:'53',label:'DNS',sub:'port 53',c:C.accent},{id:'22',label:'Remote login',sub:'port 22 (SSH)',c:C.amber}],
    cards:[{t:'to 93.184.216.34 :443 · "GET /index.html"',b:'443',why:'Port 443 is HTTPS, the web server.'},{t:'to 93.184.216.34 :5432 · "SELECT * FROM users"',b:'5432',why:'5432 is PostgreSQL, the database.'},
      {t:'to 93.184.216.34 :53 · "where is shop.com?"',b:'53',why:'Port 53 answers DNS questions.'},{t:'to 93.184.216.34 :22 · "login as admin"',b:'22',why:'Port 22 is SSH, remote login.'},
      {t:'to 93.184.216.34 :443 · "POST /cart"',b:'443',why:'Still HTTPS on 443, so the web server.'},{t:'to 93.184.216.34 :5432 · "INSERT INTO orders…"',b:'5432',why:'Database traffic goes to 5432.'},
      {t:'to 93.184.216.34 :22 · "run backup.sh"',b:'22',why:'Remote commands come in over SSH on 22.'},{t:'to 93.184.216.34 :53 · "what is the IP of api.shop.com?"',b:'53',why:'Name → address questions are DNS, port 53.'}]})});
