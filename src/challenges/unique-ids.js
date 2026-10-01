/* ---------------- A3. UNIQUE IDS: pick the scheme ---------------- */
chal('unique-ids',{title:'Pick the ID scheme',goal:'For each situation, choose auto-increment, UUID or Snowflake IDs.',
  hint:'One small database → auto-increment. No coordination possible, or IDs must be unguessable → UUID. Huge scale and time-sorted → Snowflake.',
  make:sortGame({bins:[{id:'auto',label:'Auto-increment',sub:'1, 2, 3… from one DB',c:C.blue},{id:'uuid',label:'UUID',sub:'random 128-bit',c:C.accent},{id:'snow',label:'Snowflake',sub:'time · machine · seq',c:C.green}],
    cards:[{t:'A small app with one database and light traffic',b:'auto',why:'One counter is simple and plenty at this scale.'},{t:'Notes created offline on phones and synced later',b:'uuid',why:'Phones cannot ask a central counter while offline.'},
      {t:'500 servers creating a million posts per second, shown newest first',b:'snow',why:'No central counter, and the IDs sort by time.'},{t:'Public order links nobody should be able to guess',b:'uuid',why:'Random IDs cannot be guessed or counted.'},
      {t:'Invoice numbers that must be sequential with no gaps',b:'auto',why:'Only a single counter guarantees 1, 2, 3 with no gaps.'},{t:'Chat messages that must sort by send time across many servers',b:'snow',why:'Time comes first in the ID, so sorting by ID sorts by time.'},
      {t:'Merging two companies\' databases without clashes',b:'uuid',why:'Random 128-bit IDs practically never collide.'}]})});
