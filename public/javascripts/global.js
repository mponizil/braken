var LAT, LNG;

navigator.geolocation.getCurrentPosition( function(loc) {
  LAT = loc.coords.latitude;
  LNG = loc.coords.longitude;
  gps(loc);
})

function gps(loc) {}
function distance(from, to) {
  var lat = from.lat - to.lat;
  var lng = from.lng - to.lng;
  var dst = Math.sqrt(lat * lat + lng * lng);
  var km = dst * 111;
  var meters = km * 1000;
  var feet = Math.round(meters * 3.2808399);
  return feet;
}