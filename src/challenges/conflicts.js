/* ---------------- A1c. CONFLICTS: read the vector clocks ---------------- */
chal('conflicts',{title:'Read the vector clocks',goal:'For each pair of versions, decide: did X happen before Y, Y before X, or are they concurrent?',
  hint:'X came first if every count in X is less than or equal to Y\'s. If each one is ahead somewhere, they are concurrent.',
  make:sortGame({bins:[{id:'xy',label:'X came first',sub:'keep Y',c:C.blue},{id:'yx',label:'Y came first',sub:'keep X',c:C.accent},{id:'c',label:'Concurrent',sub:'a real conflict',c:C.amber}],
    cards:[{t:'X [A:1, B:0]   ·   Y [A:1, B:1]',b:'xy',why:'Y has every count of X and one more on B, so X came first.'},
      {t:'X [A:2, B:1]   ·   Y [A:1, B:1]',b:'yx',why:'X is ahead on A and equal on B, so Y came first.'},
      {t:'X [A:2, B:0]   ·   Y [A:1, B:1]',b:'c',why:'X is ahead on A, Y is ahead on B: neither saw the other.'},
      {t:'X [A:1, B:2, C:0]   ·   Y [A:1, B:2, C:1]',b:'xy',why:'Y matches X and is one ahead on C.'},
      {t:'X [A:0, B:3]   ·   Y [A:1, B:2]',b:'c',why:'X is ahead on B, Y is ahead on A: concurrent.'},
      {t:'X [A:4, B:4]   ·   Y [A:2, B:3]',b:'yx',why:'X is ahead on both, so Y came first.'},
      {t:'X [A:1, B:1, C:1]   ·   Y [A:2, B:1, C:0]',b:'c',why:'X is ahead on C, Y is ahead on A: concurrent.'}]})});
