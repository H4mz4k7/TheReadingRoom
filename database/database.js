var mongoose = require('mongoose');



var mongoDB = 'mongodb://127.0.0.1:27017/database';

mongoose.Promise = global.Promise;
mongoose.connect(mongoDB);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
    console.log('MongoDB connection successful!');
});
