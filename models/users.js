var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UsersSchema = new Schema(
    {
        email: {type: String, required: true},
        username: {type: String, required: true, max: 100},
        password: {type: String, required: true},
        user_id: {type: Number, required: true, index: true}
    }
);

var Users = mongoose.model('Users', UsersSchema);

module.exports = Users;