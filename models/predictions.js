const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Prediction Schema
const PredictionsSchema = new Schema({
    user_id: {
        type: Number, 
        required: true,
        index: true 
    },
    book_id: {
        type: Number,
        required: true,
        index: true 
    },
    prediction: {
        type: Number, 
        required: true
    }
});

// Create the model from the schema
const Predictions = mongoose.model('Predictions', PredictionsSchema);

module.exports = Predictions;