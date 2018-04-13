//var mapView = null;
//$('[data-toggle="tooltip"]').tooltip();
//$('#map').hide();

//require([
//  'esri/views/MapView',
//  'esri/WebMap',
//  // 'esri/tasks/IdentifyTask', // TODO: remove?
//  // 'esri/tasks/support/IdentifyParameters', // TODO: remove?
//  // 'esri/widgets/BasemapToggle',
//  'dojo/domReady!',
//], function(
//  MapView,
//  /* IdentifyTask, IdentifyParameters, */ BasemapToggle,
//  WebMap
//) {
//  /************************************************************
//   * Creates a new WebMap instance. A WebMap must reference
//   * a PortalItem ID that represents a WebMap saved to
//   * arcgis.com or an on-premise portal.
//   *
//   * To load a WebMap from an on-premise portal, set the portal
//   * url with esriConfig.portalUrl.
//   ************************************************************/
//  var webmap = new WebMap({
//    portalItem: {
//      // id: 'c13022a5c4754b958d3af300b2f0afc3',
//      id: '505bc0a0a0cf450e9b40658672ce16be',
//    },
//  });

//  /************************************************************
//   * Set the WebMap instance to the map property in a MapView.
//   ************************************************************/
//  mapView = new MapView({
//    map: webmap,
//    container: 'map',
//    center: [-86.75, 36.16], // Nashville, TN
//    zoom: 11,
//  });

//  // var toggle = new BasemapToggle({
//  //   view: mapView,
//  //   nextBasemap: "hybrid" // allows for toggling to the 'hybrid' basemap
//  // });

//  // mapView.ui.add(toggle, "top-right");

//  // mapView.when(function() {
//  //   console.log('when!');
//  //   // Layers are indexed by position
//  //   // var myLayer = mapView.layers.getItemAt(1);
//  //   // mapView.whenLayerView(myLayer).then(function(lyrView) {
//  //   //   console.log('layer found!');
//  //   // });
//  // });
//});

//function getLatLongFromAddress() {
//  addressData = {
//    singleLine: $('#AddressInput').val(),
//    outFields: 'Match_addr,Addr_type',
//  };
//  jQuery.ajax({
//    url:
//      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json',
//    type: 'POST',
//    data: addressData,
//    dataType: 'json',
//    beforeSend: function(x) {
//      if (x && x.overrideMimeType) {
//        x.overrideMimeType('application/j-son;charset=UTF-8');
//      }
//    },
//    success: function(result) {
//      var addressLatLongs = document.getElementById('retrivedCoOrdinates');
//      require(['esri/views/MapView', 'esri/WebMap', 'dojo/domReady!'], function(
//        MapView,
//        WebMap
//      ) {
//        var topHit = result.candidates[0];
//        mapView.goTo([
//          Number(topHit.location.x),
//          Number(topHit.location.y),
//        ]);
//        // .then(
//        //   // TODO: Create a point graphic (aka "marker) to show the geocode result.
//        //   function() {
//        //     console.log('then!');
//        //   }
//        // );
//      });

//      //Show information and map
//      showWaterwayInfoAndMap();
//    },
//  });
//}

//function getAddressFromBrowserLocation() {
//  if (navigator.geolocation) {
//    navigator.geolocation.getCurrentPosition(
//      getAddressFromBrowserLocationSucess,
//      onFail,
//      { enableHighAccuracy: true, timeout: 20000 }
//    );
//  } else {
//    x.innerHTML = 'Geolocation is not supported by this browser.';
//  }
//}

//function onFail() {
//  console.log('Error: unable to get geolocation');
//}

//function getAddressFromBrowserLocationSucess(position) {
//  addressData = {
//    location: position.coords.longitude + ',' + position.coords.latitude,
//    outFields: 'Match_addr,Addr_type',
//  };
//  jQuery.ajax({
//    url:
//      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json',
//    type: 'POST',
//    data: addressData,
//    dataType: 'json',
//    beforeSend: function(x) {
//      if (x && x.overrideMimeType) {
//        x.overrideMimeType('application/j-son;charset=UTF-8');
//      }
//    },
//    success: function(result) {
//      $('#AddressInput').val(result.address.Match_addr);
//      mapView.goTo([Number(result.location.x), Number(result.location.y)]);
//      // .then(
//      //   // TODO: Create a point graphic (aka "marker) to show the geocode result.
//      //   function() {
//      //     console.log('then!');
//      //   }
//      // );
//      //Show information and map
//      showWaterwayInfoAndMap();
//    },
//  });
//}

//function showWaterwayInfoAndMap() {
//  const waterwayInfoDomRef = document.getElementById('waterway-info');
//  let waterwayInformationHtmlTemplate = `<div class="card-body">
//  <div class="waterway-heading">
//    <h5 class="text-muted">Waterway Nearest This Address</h5>
//    <h3 class="card-title">Browns Creek</h3>
//  </div>

//  <div class="waterway-health text-danger">
//    <p class="font-weight-bold">Status: <span id="waterway-status">Unhealthy</span></p>
//  </div>

//  <div class="waterway-problems">
//    <p>Select a problem to see how you can help this stream:</p>
//    <ul id="waterway-problems-list">
//      <li><a href="#">Pathogens</a></li>
//      <li><a href="#">Nutrients</a></li>
//      <li><a href="#"></a></li>
//    </ul>

//  </div>

//  <div class="waterway-adopt">
//    <h6 class="font-weight-bold">Adopt a Waterway</h6>
//    <p>
//      Are you a member of a group or organization in your community that would be interested in adopting this waterway?
//      <a href="#">Learn more...</a>
//    </p>

//  </div>

//  <div class="waterway-nearby">
//    <h6 class="font-weight-bold">Adjacent Waterways</h6>
//    <p>Check the health of these waterways near this address:</p>
//    <ul id="neighbor-waterways-list">
//      <li><a href="#">Check Upstream Water Health</a></li>
//      <li><a href="#">Check Downstream Water Health</a></li>
//    </ul>
//  </div>

//  </div>`;

//  console.log(waterwayInfoDomRef);
//  waterwayInfoDomRef.innerHTML = waterwayInformationHtmlTemplate;
//  $('#map').show();
//}
