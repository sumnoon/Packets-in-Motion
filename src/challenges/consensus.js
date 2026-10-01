/* ---------------- A1. CONSENSUS: can they still decide? ---------------- */
chal('consensus',{title:'Majority or not?',goal:'For each cluster, decide: can the reachable nodes still elect a leader and accept writes?',
  hint:'Count the reachable nodes and compare with the whole cluster: they need MORE than half of the total, not of the survivors.',
  make:sortGame({bins:[{id:'ok',label:'Keeps working',sub:'a majority is reachable',c:C.green},{id:'no',label:'Stops writes',sub:'no majority',c:C.red}],
    cards:[{t:'5 nodes, 2 have crashed',b:'ok',why:'3 of 5 is a majority.'},{t:'5 nodes, 3 have crashed',b:'no',why:'2 of 5 is not more than half.'},{t:'3 nodes, the leader crashed',b:'ok',why:'2 of 3 can elect a new leader.'},
      {t:'4 nodes, 2 have crashed',b:'no',why:'2 of 4 is exactly half, not a majority. That is why clusters use odd sizes.'},{t:'6 nodes split 3 | 3 by a network cut',b:'no',why:'Neither side has more than half, so both sides stop.'},
      {t:'7 nodes split 4 | 3: the side with 4',b:'ok',why:'4 of 7 is a majority, so that side carries on.'},{t:'5 nodes split 3 | 2: the side with 2',b:'no',why:'The small side must stop, or there could be two leaders.'},{t:'1 node on its own (no replicas)',b:'ok',why:'1 of 1 is a majority, but one crash stops everything.'}]})});
