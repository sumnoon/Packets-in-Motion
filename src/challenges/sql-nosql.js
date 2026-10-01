/* ---------------- 7. SQL vs NoSQL: sort the workloads ---------------- */
chal('sql-nosql',{title:'Pick the database',goal:'Sort each workload into the kind of database that fits it best.',
  hint:'Money, bookings and reports that join tables → SQL. Huge volume, flexible shapes, lookups by one key → NoSQL.',
  make:sortGame({bins:[{id:'sql',label:'SQL',sub:'tables · joins · transactions',c:C.blue},{id:'no',label:'NoSQL',sub:'documents · key-value · wide rows',c:C.green}],
    cards:[{t:'Bank transfers between two accounts',b:'sql',why:'Money needs transactions: both sides change, or neither does.'},{t:'Product catalog where every item has different attributes',b:'no',why:'Documents let every product keep its own shape.'},
      {t:'Monthly report joining orders, customers and products',b:'sql',why:'JOINs across related tables are what SQL is built for.'},{t:'Chat messages: millions per minute, read by conversation',b:'no',why:'Enormous write volume, always read by one key. That is NoSQL territory.'},
      {t:'Shopping carts and login sessions by user id',b:'no',why:'A simple key → value lookup, at huge scale.'},{t:'Hotel booking: never double-book a room',b:'sql',why:'Constraints and transactions prevent double-booking.'},
      {t:'Readings from a million IoT sensors',b:'no',why:'A firehose of time-stamped writes suits wide-column or time-series stores.'},{t:'Employee records with a strict schema',b:'sql',why:'Fixed columns and relationships favour SQL.'}]})});
