/* ---------------- 13. REST / gRPC / WebSockets ---------------- */
chal('rest-grpc-ws',{title:'Pick the protocol',goal:'Match each feature to REST, gRPC or WebSockets.',
  hint:'Public and simple → REST. Service-to-service and fast → gRPC. The server must push the moment something happens → WebSockets.',
  make:sortGame({bins:[{id:'rest',label:'REST',sub:'HTTP + JSON',c:C.blue},{id:'grpc',label:'gRPC',sub:'binary · internal',c:C.accent},{id:'ws',label:'WebSockets',sub:'stays open · push',c:C.green}],
    cards:[{t:'Public API for third-party developers',b:'rest',why:'Anyone can call REST with curl and read JSON.'},{t:'Chat: messages must appear instantly',b:'ws',why:'The server has to push new messages without being asked.'},
      {t:'Internal calls between 40 microservices',b:'grpc',why:'Compact binary messages and strict contracts, fast between services.'},{t:'Live sports scores pushed to fans',b:'ws',why:'Scores are pushed the moment they change.'},
      {t:'Mobile app loads a user profile',b:'rest',why:'One simple request-response for a resource.'},{t:'Streaming ML predictions between backends',b:'grpc',why:'gRPC streams typed messages efficiently between services.'},
      {t:'Showing other people\'s cursors in a shared doc',b:'ws',why:'Constant two-way updates need an open connection.'},{t:'CRUD for a small blog',b:'rest',why:'Create, read, update, delete: REST\'s home turf.'}]})});
