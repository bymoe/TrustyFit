import { $ } from "./bling";

function getLocation(e) {
  const directionButton = $(".single__contact.direction");
  e.preventDefault();
  function success(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    const storeLat = directionButton.getAttribute("data-lat");
    const storeLng = directionButton.getAttribute("data-lng");

    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${storeLat},${storeLng}`,
      "_blank"
    );
  }

  function error() {
    throw new Error("Error getting location!");
  }
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
  } else {
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

export default getLocation;
