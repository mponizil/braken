socket = io.connect('/post');
socket.emit('init', { post_id: '#{post._id}' });

$(function() {
  $("#confirm").click(function() {
    $.post("/confirm", { post_id: post_id })
  })
  $("#deny").click(function() {
    $.post("/deny", { post_id: post_id })
  })
})

function gps(loc) {
  var d = distance({ lat: plat, lng: plng }, { lat: LAT, lng: LNG });
  $("#distance").html("(" + d + "ft)")
}