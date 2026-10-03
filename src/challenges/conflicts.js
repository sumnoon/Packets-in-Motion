/* ---------------- A1c. CONFLICTS: read the vector clocks ---------------- */
chal('conflicts',{title:'Read the vector clocks',goal:'Decide whether X precedes Y, Y precedes X, the clocks are equal, or the versions are concurrent.',
  hint:'Precedence requires all counts ≤ and at least one strictly smaller. Equal clocks are the same version/duplicate in this model; concurrent clocks are each ahead somewhere.',
  make:sortGame({bins:[{id:'xy',label:'X came first',sub:'keep Y',c:C.blue},{id:'yx',label:'Y came first',sub:'keep X',c:C.accent},{id:'c',label:'Concurrent',sub:'a real conflict',c:C.amber},{id:'eq',label:'Equal clocks',sub:'same version / duplicate',c:C.green}],
    cards:[{t:'X [A:1, B:0]   ·   Y [A:1, B:1]',b:'xy',why:'Y has every count of X and one more on B, so X came first.'},
      {t:'X [A:2, B:1]   ·   Y [A:1, B:1]',b:'yx',why:'X is ahead on A and equal on B, so Y came first.'},
      {t:'X [A:2, B:0]   ·   Y [A:1, B:1]',b:'c',why:'X is ahead on A, Y is ahead on B: neither saw the other.'},
      {t:'X [A:1, B:2, C:0]   ·   Y [A:1, B:2, C:1]',b:'xy',why:'Y matches X and is one ahead on C.'},
      {t:'X [A:0, B:3]   ·   Y [A:1, B:2]',b:'c',why:'X is ahead on B, Y is ahead on A: concurrent.'},
      {t:'X [A:4, B:4]   ·   Y [A:2, B:3]',b:'yx',why:'X is ahead on both, so Y came first.'},
      {t:'X [A:1, B:1, C:1]   ·   Y [A:2, B:1, C:0]',b:'c',why:'X is ahead on C, Y is ahead on A: concurrent.'},
      {t:'X [A:2, B:1]   ·   Y [A:2, B:1]',b:'eq',why:'Every component is equal. Neither clock strictly precedes the other; this represents the same version or a duplicate in the model.'}]})});
