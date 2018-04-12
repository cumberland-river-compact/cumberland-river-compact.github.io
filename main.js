var MainMapView = null;
$( "#map" ).hide();

require(['esri/views/MapView', 'esri/WebMap', 'dojo/domReady!'], function(
  MapView,
  WebMap
) {
  /************************************************************
   * Creates a new WebMap instance. A WebMap must reference
   * a PortalItem ID that represents a WebMap saved to
   * arcgis.com or an on-premise portal.
   *
   * To load a WebMap from an on-premise portal, set the portal
   * url with esriConfig.portalUrl.
   ************************************************************/
  var webmap = new WebMap({
    portalItem: {
      // autocasts as new PortalItem()
      id: '505bc0a0a0cf450e9b40658672ce16be',
    },
  });

  /************************************************************
   * Set the WebMap instance to the map property in a MapView.
   ************************************************************/
  MainMapView = new MapView({
    map: webmap,
    container: 'map',
    center: [-86, 37],
    zoom: 13,
  });
});

function getLatLongFromAddress() {
  addressData = {
    singleLine: $('#AddressInput').val(),
    outFields: 'Match_addr,Addr_type',
  };
  jQuery.ajax({
    url:
      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json',
    type: 'POST',
    data: addressData,
    dataType: 'json',
    beforeSend: function(x) {
      if (x && x.overrideMimeType) {
        x.overrideMimeType('application/j-son;charset=UTF-8');
      }
    },
    success: function(result) {
      var addressLatLongs = document.getElementById('retrivedCoOrdinates');
      require(['esri/views/MapView', 'esri/WebMap', 'dojo/domReady!'], function(
        MapView,
        WebMap
      ) {
        var top = result.candidates[0];
        MainMapView.goTo([
          Number(result.candidates[0].location.x),
          Number(result.candidates[0].location.y),
        ]);
        // MainMapView.goTo({
        //   target: new Extent(694942, 5596444, 1284090, 6163926, SpatialReference.WebMercator),
        //   // target: new Extent(694942, 5596444, 1284090, 6163926, SpatialReference.WebMercator),
        //   heading: -20
        // }, {
        //   animate: false
        // });
      });

      //Show information and map
      showWaterwayInfoAndMap()
    }
  });
}

function getAddressFromBrowserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      getAddressFromBrowserLocationSucess,
      onFail,
      { enableHighAccuracy: true, timeout: 20000 }
    );
  } else {
    x.innerHTML = 'Geolocation is not supported by this browser.';
  }
}

function onFail() {
  console.log('Error: unable to get geolocation');
}

function getAddressFromBrowserLocationSucess(position) {
  console.log("test");
  
  addressData = {
    location: position.coords.longitude + ',' + position.coords.latitude,
    outFields: 'Match_addr,Addr_type',
  };
  jQuery.ajax({
    url:
      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json',
    type: 'POST',
    data: addressData,
    dataType: 'json',
    beforeSend: function(x) {
      if (x && x.overrideMimeType) {
        x.overrideMimeType('application/j-son;charset=UTF-8');
      }
    },
    success: function(result) {
      $('#AddressInput').val(result.address.Match_addr);
      MainMapView.goTo([Number(result.location.x), Number(result.location.y)]);

      //Show information and map
      showWaterwayInfoAndMap()

    }
  });
}


function showWaterwayInfoAndMap(){
  const waterwayInfoDomRef = document.getElementById("waterway-info");
  let waterwayInformationHtmlTemplate = `<div class="card-body">
  <div class="waterway-heading">
    <h5 class="text-muted">Waterway nearest this address</h5>
    <h3 class="card-title">Browns Creek</h3>
  </div>

  <div class="waterway-health text-danger">
    <p class="font-weight-bold">Status: <span id="waterway-status">Unhealthy</span></p>
  </div>

  <div class="waterway-problems">
    <p>Select a problem to see how you can help this stream:</p>
    <ul id="waterway-problems-list">
      <li><a href="#">Pathogens</a></li>
      <li><a href="#">Nutrients</a></li>
      <li><a href="#"></a></li>
    </ul>

  </div>

  <div class="waterway-adopt">
    <h6 class="font-weight-bold">Adopt a Waterway</h6>
    <p>
      Are you a member of a group or organization in your community that would be interested in adopting this waterway?
      <a href="#">Learn more</a>
    </p>

  </div>

  <div class="waterway-nearby">
    <h6 class="font-weight-bold">Neighboring Waterways</h6>
    <p>Check the health of these waterways near this address:</p>
    <ul id="neighbor-waterways-list"></ul>
  </div>

  </div>`;

  console.log(waterwayInfoDomRef);
  waterwayInfoDomRef.innerHTML = waterwayInformationHtmlTemplate;
  $( "#map" ).show();
}
