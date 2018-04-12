var MainMapView = null;

require([
  'esri/views/MapView',
  'esri/WebMap',
  // 'esri/tasks/IdentifyTask', // TODO: remove?
  // 'esri/tasks/support/IdentifyParameters', // TODO: remove?
  'dojo/domReady!',
], function(MapView, /* IdentifyTask, IdentifyParameters, */ WebMap) {
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
      // id: 'c13022a5c4754b958d3af300b2f0afc3',
      id: '505bc0a0a0cf450e9b40658672ce16be',
    },
  });

  /************************************************************
   * Set the WebMap instance to the map property in a MapView.
   ************************************************************/
  MainMapView = new MapView({
    map: webmap,
    container: 'map',
    center: [-86.75, 36.16],
    zoom: 12,
  });

  MainMapView.when(function() {
    console.log('when!');
    // Layers are indexed by position
    // var myLayer = MainMapView.layers.getItemAt(1);
    // MainMapView.whenLayerView(myLayer).then(function(lyrView) {
    //   console.log('layer found!');
    // });
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
        var topHit = result.candidates[0];
        MainMapView.goTo([
          Number(topHit.location.x),
          Number(topHit.location.y),
        ]).then(
          // TODO: Create a point graphic (aka "marker) to show the geocode result.
          function() {
            console.log('then!');
          }
        );
      });
    },
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
      MainMapView.goTo([
        Number(result.location.x),
        Number(result.location.y),
      ]).then(
        // TODO: Create a point graphic (aka "marker) to show the geocode result.
        function() {
          console.log('then!');
        }
      );
    },
  });
}
