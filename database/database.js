var mongoose = require('mongoose');

//The URL which will be queried. Run "mongod.exe" for this to connect
// Define the MongoDB connection string
var mongoDB = 'mongodb://127.0.0.1:27017/database';

// Set Mongoose to use global Promises
mongoose.Promise = global.Promise;

// Connect to the MongoDB database
mongoose.connect(mongoDB);

// Get the connection object
var db = mongoose.connection;

// Bind the error event to get notified of connection errors
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Once the connection is open, log a success message
db.once('open', function() {
    console.log('MongoDB connection successful!');
});
