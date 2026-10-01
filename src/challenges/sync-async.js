/* ---------------- 15. SYNC vs ASYNC: make checkout fast ---------------- */
chal('sync-async',{title:'Make checkout fast',goal:'For each task in "Place order", decide: do it now, before replying, or later in a background worker. The customer must never be misled.',
  hint:'Only what the customer must know before the page says "Order placed" belongs in "now". Everything else can happen seconds later.',
  make:sortGame({bins:[{id:'now',label:'Now (they wait)',sub:'before replying',c:C.amber},{id:'later',label:'Later (worker)',sub:'after replying',c:C.green}],
    cards:[{t:'Check the cart is valid · 50 ms',b:'now',why:'You cannot accept an invalid order.',ms:50},{t:'Charge the card · 400 ms',b:'now',why:'The customer must know if payment failed before you say "done".',ms:400},
      {t:'Save the order · 30 ms',b:'now',why:'If you have not saved it, the order does not exist yet.',ms:30},{t:'Send confirmation email · 800 ms',b:'later',why:'An email a few seconds later is fine.',ms:800},
      {t:'Update recommendations · 1200 ms',b:'later',why:'Nobody waits for recommendations.',ms:1200},{t:'Generate PDF invoice · 900 ms',b:'later',why:'The invoice can arrive by email later.',ms:900},{t:'Notify the warehouse · 300 ms',b:'later',why:'The warehouse can pick it up from a queue.',ms:300}],
    done(miss,n){return miss===0?{stars:3,title:'480 ms instead of 3.7 s',msg:'Only three tasks (validate, charge, save) make the customer wait. Everything else happens in the background, so the reply is about 8× faster.'}:
      {stars:miss<=1?2:1,title:`${miss} task${miss>1?'s':''} in the wrong lane`,msg:'Doing slow work before replying makes everyone wait. Doing the payment later lies to the customer. Find the balance.'};}})});
