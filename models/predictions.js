const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PredictionsSchema = new Schema({
    user_id: {type: Number, required: true, index: true },
    book_id: {type: Number, required: true, index: true },
    prediction: {type: Number,  required: true}
});

const Predictions = mongoose.model('Predictions', PredictionsSchema);

module.exports = Predictions;