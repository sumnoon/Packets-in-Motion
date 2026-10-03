/* ---------------- A2. TRANSACTIONS: unwind the saga ---------------- */
chal('transactions',{title:'Unwind the saga',goal:'Booking the car fails. Put the saga\'s steps in order, including the compensations that undo the earlier steps.',
  hint:'For this successful recovery, compensate in reverse and tell the customer last. Persist progress and retry idempotently; repeated failure may need manual recovery.',
  make:orderGame({head:'Flight → hotel → car fails; both compensations succeed. What is the order?',msg:'This recovery succeeded. Persist saga state and retry idempotent compensations safely. Repeated failures can need manual intervention, and irreversible effects require a business remedy.',
    steps:[{t:'Book flight',sub:'✓ committed'},{t:'Book hotel',sub:'✓ committed'},{t:'Book car',sub:'✕ no cars left'},{t:'Cancel hotel',sub:'compensation'},{t:'Refund flight',sub:'compensation'},{t:'Tell the customer',sub:'trip cancelled'}]})});
