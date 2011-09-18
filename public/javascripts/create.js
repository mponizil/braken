$(function() {
  $("#new_post").submit(function() {
    $.post("/create", { lat: LAT, lng: LNG, title: $("input[name='title']").val(), description: $("input[name='description']").val() }, function(data) {
      console.log(data);
      var res = $.parseJSON(data);
      window.location = "/post/" + res.post_id;
    });
    return false;
  })
})

function gps(loc) {
  var latlng = new google.maps.LatLng(LAT, LNG);
  var myOptions = {
    zoom: 14,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
}