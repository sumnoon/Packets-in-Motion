/* ---------------- S1. STORAGE ENGINES: pick the engine ---------------- */
chal('storage-engines',{title:'Pick the storage engine',goal:'Sort each workload onto the engine that suits it: a B-tree or an LSM tree.',
  hint:'Many writes, mostly appends: LSM. Many reads, updates in place and steady latency: B-tree.',
  make:sortGame({bins:[{id:'b',label:'B-tree',sub:'update in place',c:C.accent},{id:'l',label:'LSM tree',sub:'write in batches, merge later',c:C.green}],
    cards:[{t:'Bank ledger: many reads, updates in place, strict transactions',b:'b',why:'B-trees give steady reads and in-place updates, ideal for transactional data.'},
      {t:'Ingesting 500,000 sensor readings per second',b:'l',why:'An LSM tree turns a flood of writes into a few sequential flushes.'},
      {t:'Product catalog read 1,000× more often than it changes',b:'b',why:'Read-heavy data favours one sorted tree over checking several files.'},
      {t:'Append-only activity log, rarely read',b:'l',why:'Appends are exactly what LSM trees are built for.'},
      {t:'Time-series metrics: heavy writes, reads of recent data',b:'l',why:'Writes stream in; recent data sits in the memtable and newest files.'},
      {t:'Must avoid latency spikes from background compaction',b:'b',why:'B-trees have no compaction bursts, so latency stays predictable.'},
      {t:'Chat history across many machines, written constantly',b:'l',why:'Cassandra-style write-heavy stores use LSM trees.'},
      {t:'Range scans over a well-indexed table with modest writes',b:'b',why:'Sorted B-tree pages make range scans cheap.'}]})});
