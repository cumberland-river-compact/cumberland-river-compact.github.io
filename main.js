require([
  // ArcGIS
  'esri/Map',
  'esri/WebMap',
  'esri/views/MapView',

  // Widgets
  // TODO: Remove what we don't use...
  'esri/widgets/Home',
  'esri/widgets/Zoom',
  'esri/widgets/Compass',
  'esri/widgets/Search',
  'esri/widgets/Legend',
  'esri/widgets/BasemapToggle',
  'esri/widgets/ScaleBar',
  'esri/widgets/Attribution',

  // Tasks
  'esri/tasks/IdentifyTask',
  'esri/tasks/support/IdentifyParameters',

  // Bootstrap
  'bootstrap/Collapse',
  'bootstrap/Dropdown',

  // Calcite Maps
  'calcite-maps/calcitemaps-v0.7',
  // Calcite Maps ArcGIS Support
  'calcite-maps/calcitemaps-arcgis-support-v0.7',

  'dojo/domReady!',
], function(
  Map,
  WebMap,
  MapView,
  Home,
  Zoom,
  Compass,
  Search,
  Legend,
  BasemapToggle,
  ScaleBar,
  Attribution,
  IdentifyTask,
  IdentifyParameters,
  Collapse,
  Dropdown,
  CalciteMaps,
  CalciteMapArcGISSupport
) {
  var identifyTask, params;

  // TODO: Can we get this URL from the map or the layer's ArcGIS content ID?
  var drainageAreasUrl =
    'https://watersgeo.epa.gov/arcgis/rest/services/NHDPlus_NP21/Catchments_NP21_Simplified/MapServer';

  // Map
  var map = new WebMap({
    portalItem: {
      // id: '9f91f911f58540ceaac0300c55e18fbb', // Just a random map for testing
      id: '505bc0a0a0cf450e9b40658672ce16be',
    },
  });

  // View
  var mapView = new MapView({
    container: 'mapViewDiv',
    map: map,
    padding: {
      // Use the same value as #header-img height
      top: 395,
      bottom: 10,
      right: 10,
      left: 10,
    },
    ui: { components: [] },
  });

  mapView.when(function() {
    console.log('when!');
    // Create an identify task to locate boundaries
    identifyTask = new IdentifyTask(drainageAreasUrl);
    params = new IdentifyParameters();
    params.tolerance = 1;
    params.layerIds = [0]; // This map service's layer is found by ID
    params.layerOption = 'top';
    params.width = mapView.width;
    params.height = mapView.height;
  });

  // Popup and panel sync
  mapView.when(function() {
    CalciteMapArcGISSupport.setPopupPanelSync(mapView);
  });

  var searchWidget = new Search({
    container: 'searchWidgetDiv',
    view: mapView,
    // allPlaceholder: 'Find an address or place',
    locationEnabled: true,
    maxSuggestions: 3,
    minSuggestCharacters: 2,
    maxResults: 1,
    searchAllEnabled: false,
  });
  // CalciteMapArcGISSupport.setSearchExpandEvents(searchWidget);

  searchWidget.on('search-clear', function(event) {
    console.log('Search input textbox was cleared.');
  });

  searchWidget.on('search-complete', function(event) {
    // The results are stored in the event Object[]
    console.log('Results of the search: ', event);
    if (event.results) {
      var result = event.results[0].results[0];
      console.log('Name: ', result.name);
      console.log('Location: ', result.feature);

      // Set the geocode result as input to our Identity Task
      params.geometry = result.feature.geometry;
      params.mapExtent = mapView.extent; // TODO: Expand the search!

      // TODO: Show a wait cursor or spinner
      // dom.byId('mapViewDiv').style.cursor = 'wait';

      // This function returns a promise that resolves to an array of features
      identifyTask
        .execute(params)
        .then(function(response) {
          var results = response.results;
          if (results[0]) {
            var drainageArea = results[0];
            var feature = drainageArea.feature;
            var layerName = drainageArea.layerName;
            feature.attributes.layerName = layerName;
            feature.popupTemplate = {
              // autocasts as new PopupTemplate()
              title: 'Title 123',
              content: 'Content 345',
            };
            return feature;
          }

          // return arrayUtils.map(results, function(result) {
          //   var feature = result.feature;
          //   var layerName = result.layerName;
          //   feature.attributes.layerName = layerName;
          //   if (layerName === 'Soil Survey Geographic') {
          //     feature.popupTemplate = { // autocasts as new PopupTemplate()
          //       title: "{Map Unit Name}",
          //       content: "<b>Dominant order:</b> {Dominant Order} ({Dom. Cond. Order %}%)" +
          //         "<br><b>Farmland Class:</b> {Farmland Class}"
          //     };
          //   }
          //   return feature;
          // });
        })
        .then(showPopup)
        .then(function() {
          console.log('then!');
        });

      // Shows the results of the Identify in a popup once the promise is resolved
      function showPopup(feature) {
        if (feature) {
          mapView.popup.open({
            features: [feature],
            location: mapView.center, // TODO: use correct location
          });
        }
        // TODO: Disable the wait cursor and/or spinner
        // dom.byId('mapViewDiv').style.cursor = 'auto';
      }
    }
  });
  // Map widgets
  // var home = new Home({
  //   view: mapView
  // });
  // mapView.ui.add(home, "top-left");

  var zoom = new Zoom({
    view: mapView,
  });
  mapView.ui.add(zoom, 'bottom-left');

  // var compass = new Compass({
  //   view: mapView
  // });
  // mapView.ui.add(compass, "top-left");

  var basemapToggle = new BasemapToggle({
    view: mapView,
    nextBasemap: 'todo',
    // nextBasemap: "streets-relief-vector"
  });
  mapView.ui.add(basemapToggle, 'bottom-right');

  // var scaleBar = new ScaleBar({
  //   view: mapView
  // });
  // mapView.ui.add(scaleBar, "bottom-left");

  var attribution = new Attribution({
    view: mapView,
  });
  mapView.ui.add(attribution, 'manual');

  // Panel widgets - add legend
  // var legendWidget = new Legend({
  //   container: 'legendDiv',
  //   view: mapView,
  // });
});
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
