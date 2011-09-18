$(function() {
  $("#new_post").submit(function() {
    $.post("/create", { lat: LAT, lng: LNG, title: $("input[name='title']").val(), description: $("input[name='description']").val() });
    return false;
  })
})