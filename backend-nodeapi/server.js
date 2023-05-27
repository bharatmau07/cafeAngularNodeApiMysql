require('dotenv').config();
const http = require('http');
const app = require('./index');

const server = http.createServer(app);
server.listen(process.env.PORT);


// var listener = app.listen(8888, function(){
//     console.log('Listening on port ' + listener.address().port); //Listening on port 8888
// });

