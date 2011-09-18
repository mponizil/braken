var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/kraken');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var PostSchema = new Schema({
  lat: Number,
  lng: Number,
  date: { type: Date, default: Date.now },
  title: String,
  description: String,
  picture: String,
  confirm: { type: Number, default: 0 },
  deny: { type: Number, default: 0 }
})
var VoteSchema = new Schema({
  post_id: ObjectId,
  ip: String,
  cookie_id: String,
  vote: { type: Number, default: 1 }
})

var Post = mongoose.model('Post', PostSchema);
var Vote = mongoose.model('Vote', VoteSchema);

exports.Post = Post;
exports.Vote = Vote;