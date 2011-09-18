var RADIUS = 1;

/**
 * Module dependencies.
 */

var express = require('express');
var sys = require('sys'),
    TwilioClient = require('twilio').Client,
    client = new TwilioClient('ACb77594eb2632a2d77422086328ef03a9', '536e78251ae04f88ce7828ecd66fc673', 'graffidia.com');
var phone = client.getPhoneNumber('+13475148471');
var rest = require('restler');

var MongoKraken = require('./lib/MongoKraken');
var Post = MongoKraken.Post;
var Vote = MongoKraken.Vote;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'krakerjack' }))
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res) {
  res.render('index');
});
app.get('/post/:id', function(req, res) {
  Post.findById(req.params.id, function(err, post) {
    res.render('post', { post: post });
  })
})
app.get('/create', function(req, res) {
  res.render('create')
})
app.post('/create', function(req, res) {
  var p = new Post;
  p.lat = req.body.lat;
  p.lng = req.body.lng;
  p.title = req.body.title;
  p.description = req.body.description;
  p.save(function(err) {
    console.log('post created');
    
    // broadcast new post
    list.emit('post.new', p)
    
    res.write('{ success: true }');
    res.end();
  })
})
app.post('/confirm', function(req, res) {
  var post_id = req.body.post_id;
  var ip = req.connection.remoteAddress;
  if(!req.cookies.cookie_id) {
    var cookie_id = generate_token();
    res.cookie('cookie_id', cookie_id, { expires: new Date(Date.now() + 60*60*24*365) })
  } else {
    var cookie_id = req.cookies.cookie_id;
  }
  
  Vote.find({ post_id: post_id, '$or': [ { ip: ip }, { cookie_id: cookie_id } ] }, function(err, vote) {
    if(vote.length > 0) {
      console.log('already voted');
      res.write('{ success: false, error: "already voted" }');
      res.end();
    } else {
      var v = new Vote;
      v.post_id = post_id;
      v.ip = ip;
      v.cookie_id = cookie_id;
      v.vote = 1;
      v.save(function(err) {
        Post.findById(post_id, function(err, post) {
          post.confirm++;
          post.save(function(err) {
            console.log('confirm vote');

            // broadcast vote
            list.emit('vote.confirm', { post_id: v.post_id });
            io.sockets.in(post_id).emit('vote.confirm');

            res.write('{ success: true }');
            res.end();
          })
        })
      });
    }
  })
})
app.post('/deny', function(req, res) {
  var post_id = req.body.post_id;
  var ip = req.connection.remoteAddress;
  if(!req.cookies.cookie_id) {
    var cookie_id = generate_token();
    res.cookie('cookie_id', cookie_id, { expires: new Date(Date.now() + 60*60*24*365) })
  } else {
    var cookie_id = req.cookies.cookie_id;
  }
  
  Vote.find({ post_id: post_id, '$or': [ { ip: ip }, { cookie_id: cookie_id } ] }, function(err, vote) {
    if(vote.length > 0) {
      console.log('already voted');
      res.write('{ success: false, error: "already voted" }');
      res.end();
    } else {
      var v = new Vote;
      v.post_id = post_id;
      v.ip = ip;
      v.cookie_id = cookie_id;
      v.vote = 0;
      v.save(function(err) {
        Post.findById(post_id, function(err, post) {
          post.deny++;
          post.save(function(err) {
            console.log('deny vote');

            // broadcast vote
            list.emit('vote.deny', { post_id: v.post_id })
            io.sockets.in(post_id).emit('vote.deny');

            res.write('{ success: true }');
            res.end();
          })
        })
      })
    }
  })
})

app.post('/sms', function(req, res) {
  phone.setup(function() {
    var num = req.body.From;
    var address = req.body.Body;
    var url = 'http://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address) + '&sensor=false';
    rest.get(url).on('complete', function(data) {
      var coords = data.results[0].geometry.location;
      if(!coords) {
        var msg = "Sorry we couldn't find your location.";
        phone.sendSms(num, msg, null, function() {});
        res.end();
      } else {
        var lat_max = coords.lat + RADIUS;
        var lat_min = coords.lat - RADIUS;
        var lng_max = coords.lng + RADIUS;
        var lng_min = coords.lng - RADIUS;
        Post
        .find()
        .where('lat').lte(lat_max)
        .where('lat').gte(lat_min)
        .where('lng').lte(lng_max)
        .where('lng').gte(lng_min)
        .run(function(err, posts) {
          if(posts.length > 0) {
            var all_posts = [];
            for(i in posts) {
              all_posts.push(posts[i].toObject());
              all_posts[i].distance = distance({ lat: coords.lat, lng: coords.lng }, { lat: posts[i].lat, lng: posts[i].lng });
            }
            all_posts.sort(dist_sort);
            var msg = '';
            var j = 1;
            for(i in all_posts) {
              if(j <= 3) {
                msg += j + ". " + all_posts[i].title
                msg += " (" + all_posts[i].distance + "ft)\n";
                j++;
              } else { break; }
            }
            phone.sendSms(num, msg, null, function() {});
            res.end();
          } else {
            var msg = "Nothing found in your vicinity. Bummer.";
            phone.sendSms(num, msg, null, function() {});
            res.end();
          }
        })
      }
    })
  })
})

function dist_sort(a,b) { return a.distance - b.distance; }

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var io = require('socket.io').listen(app);
io.set('log level',2);

var list = io.of('/list');
var post = io.of('/post');

list.on('connection', function(socket) {
  console.log("connected to list")
  socket.on('gps', function(data, fn) {
    data.radius = 1;
    var lat_max = data.lat + data.radius;
    var lat_min = data.lat - data.radius;
    var lng_max = data.lng + data.radius;
    var lng_min = data.lng - data.radius;
    Post
    .find()
    .where('lat').lte(lat_max)
    .where('lat').gte(lat_min)
    .where('lng').lte(lng_max)
    .where('lng').gte(lng_min)
    .run(function(err, posts) {
      var all_posts = [];
      for(i in posts) {
        all_posts.push(posts[i].toObject())
        all_posts[i].distance = distance({ lat: data.lat, lng: data.lng }, { lat: posts[i].lat, lng: posts[i].lng });
      }
      all_posts.sort(dist_sort);
      fn(all_posts);
    })
  })
  socket.on('disconnect', function() {})
})

function distance(from, to) {
  var lat = from.lat - to.lat;
  var lng = from.lng - to.lng;
  var dst = Math.sqrt(lat * lat + lng * lng);
  var km = dst * 111;
  var meters = km * 1000;
  var feet = Math.round(meters * 3.2808399);
  return feet;
}

post.on('connection', function(socket) {
  socket.on('init', function(data) {
    var post_id = data.post_id;
    socket.join(post_id);
  })
  socket.on('leave', function(data) {
    var post_id = data.post_id;
    socket.leave(post_id);
  })
})

function generate_token() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 16;
	var random_string = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		random_string += chars.substring(rnum,rnum+1);
	}
	return random_string;
}