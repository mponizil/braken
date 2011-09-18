socket = io.connect('/list');

function gps(loc) {
  socket.emit('gps', { lat: LAT, lng: LNG }, function(posts) {
    for(i in posts) {
      var li = $("<li>").attr("id","post-" + posts[i]._id);
      var a = $("<a>").attr("href","/post/" + posts[i]._id).html(posts[i].title);
      var d = $("<span>").addClass('distance').html(" (" + posts[i].distance + "ft)");
      var votes = $("<div>").addClass("votes");
      var confirm = $("<span>").addClass("confirm").html(posts[i].confirm);
      var deny = $("<span>").addClass("deny").html(posts[i].deny);
      votes.append(confirm,deny)
      li.append(a,d,votes,$("<div>").css("clear","both"));
      $("#list").append(li);
    }
  })
}

$(function() {
  $("#post-new").click(function() { window.location = "/create"; })
  
  $("li").live('click', function() {
    window.location = $(this).find("a").attr("href");
  })
  
  socket.on('post.new', function(p) {
    p.distance = distance({ lat: LAT, lng: LNG }, { lat: p.lat, lng: p.lng });
    var li = $("<li>").attr("id","post-" + p._id);
    var a = $("<a>").attr("href","/post/" + p._id).html(p.title);
    var d = $("<span>").addClass('distance').html(" (" + p.distance + "ft)");
    var votes = $("<div>").addClass("votes");
    var confirm = $("<span>").addClass("confirm").html(p.confirm);
    var deny = $("<span>").addClass("deny").html(p.deny);
    votes.append(confirm,deny)
    li.append(a,d,votes,$("<div>").css("clear","both"));
    $("#list").append(li);
  })
  
  socket.on('vote.confirm', function(data) {
    if($("#post-" + data.post_id)) {
      $("#post-" + data.post_id).find(".confirm").html(parseInt($("#post-" + data.post_id).find(".confirm").html(),10) + 1);
    }
  })
  socket.on('vote.deny', function(data) {
    if($("#post-" + data.post_id)) {
      $("#post-" + data.post_id).find(".deny").html(parseInt($("#post-" + data.post_id).find(".deny").html(),10) + 1);
    }
  })
})