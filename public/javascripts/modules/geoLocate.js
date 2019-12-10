function getLocation(e) {
  e.preventDefault();
  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log(latitude, longitude);
    // return [latitude, longitude];
  }

  function error() {
    throw new Error("Error getting location!");
  }
  if (!navigator.geolocation) {
    console.log("Geolocation is not supported by your browser");
  } else {
    console.log("Locating...");
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

export default getLocation;
