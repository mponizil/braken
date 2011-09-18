$(function() {
  $("#new_post").submit(function() {
    $.post("/create", { lat: LAT, lng: LNG, title: $("input[name='title']").val(), description: $("input[name='description']").val() }, function(data) {
      window.location = "/post/" + data.post_id;
    });
    return false;
  })
})