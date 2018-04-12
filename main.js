var MainMapView = null;

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
      id: 'c13022a5c4754b958d3af300b2f0afc3',
    },
  });

  /************************************************************
   * Set the WebMap instance to the map property in a MapView.
   ************************************************************/
  MainMapView = new MapView({
    map: webmap,
    container: 'map',
    center: [-86, 37],
    zoom: 12,
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
        MainMapView.center = [
          Number(result.candidates[0].location.x),
          Number(result.candidates[0].location.y),
        ];
      });
    },
  });
}
