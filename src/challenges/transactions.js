/* ---------------- A2. TRANSACTIONS: unwind the saga ---------------- */
chal('transactions',{title:'Unwind the saga',goal:'Booking the car fails. Put the saga\'s steps in order, including the compensations that undo the earlier steps.',
  hint:'Compensate in reverse: undo the most recent successful step first, and tell the customer last.',
  make:orderGame({head:'Flight → hotel → car, and the car fails. What happens, in order?',msg:'Each step commits on its own. When one fails, compensations undo the others in reverse order. No locks, nothing stuck.',
    steps:[{t:'Book flight',sub:'✓ committed'},{t:'Book hotel',sub:'✓ committed'},{t:'Book car',sub:'✕ no cars left'},{t:'Cancel hotel',sub:'compensation'},{t:'Refund flight',sub:'compensation'},{t:'Tell the customer',sub:'trip cancelled'}]})});
