/* ---------------- 12. CAP: choose a side ---------------- */
chal('cap',{title:'Partition! Pick a side',goal:'The network just split. For each feature, choose: refuse to answer until it heals (CP), or answer with maybe-stale data (AP).',
  hint:'If a wrong answer costs money or double-sells something, choose consistency. If a slightly old number is harmless, stay available.',
  make:sortGame({bins:[{id:'cp',label:'Consistent (CP)',sub:'refuse rather than be wrong',c:C.blue},{id:'ap',label:'Available (AP)',sub:'answer now, fix up later',c:C.green}],
    cards:[{t:'Bank account balance',b:'cp',why:'Showing an old balance could let someone spend money twice.'},{t:'Like count on a post',b:'ap',why:'An old like count for a few seconds hurts nobody.'},
      {t:'Adding items to a shopping cart',b:'ap',why:'Amazon famously keeps carts available and merges them later.'},{t:'Selling the last concert ticket',b:'cp',why:'Two nodes could each sell the same last ticket.'},
      {t:'DNS records',b:'ap',why:'DNS happily serves cached, slightly old answers.'},{t:'A distributed lock (who is leader?)',b:'cp',why:'Two leaders at once is exactly the bug a lock prevents.'},
      {t:'Comments under a video',b:'ap',why:'A comment showing up a second late is fine.'},{t:'Booking seat 14C on a flight',b:'cp',why:'Double-booking a seat is not acceptable.'}]})});
