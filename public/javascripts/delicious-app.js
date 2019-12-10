import "../sass/style.scss";

import { $, $$ } from "./modules/bling";
import autocomplete from "./modules/autocomplete";
import typeAhead from "./modules/typeAhead";
import makeMap from "./modules/map";
import ajaxHeart from "./modules/heart";
import geoLocate from "./modules/geoLocate";

autocomplete($("#address"), $("#lat"), $("#lng"));
typeAhead($(".search"));

makeMap($("#map"));
const heartForms = $$("form.heart");
heartForms.on("submit", ajaxHeart);
const directionButton = $(".single__contact.direction");
const mapButton = $(".single__map");
if (directionButton && mapButton) {
  directionButton.on("click", geoLocate);
  mapButton.on("click", geoLocate);
}
