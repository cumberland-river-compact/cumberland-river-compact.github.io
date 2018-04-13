let crcBaseUrl = "http://cumberlandriverbasin.org/"

const waterwayInfoDomRef = document.getElementById('waterway-info');
waterwayInfoDomRef.innerHTML = `<div class="card-body"><h3>How Healthy is Your Waterway?</h3><p>The Cumberland River Basin is a vast region that includes 18,000 square miles of land and over 20,000 miles of streams and rivers. The region is one of the most biodiverse on Earth - home to thousands upon thousands of plant and animal species and nearly 3 million people, all of whom depend on clean and abundant water to survive.

Today, thousands of miles of our basin’s waterways are unhealthy. But, it doesn’t have to be this way. Each and every one of us shares a connection with a waterway and a connection to its health. Use iCreek, to uncover your waterway,  determine its health, and to get connected to ideas, people, and resources who can help you promite water quality in your community.</p></div>`


require([
  // ArcGIS
  'esri/WebMap',
  'esri/views/MapView',

  // Widgets
  // TODO: Remove what we don't use...
  'esri/widgets/Zoom',
  'esri/widgets/Search',
  'esri/widgets/BasemapToggle',
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
  WebMap,
  MapView,
  Zoom,
  Search,
  BasemapToggle,
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
    'https://start.gisbiz.com/arcgis/rest/services/cumberland/MapServer/3';

  // Map
  var map = new WebMap({
    portalItem: {
      id: '2dd1e0044d2943779b63612cd9e3bd6e',
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
          if (response) {
            var drainageArea = response;
            var layerName = drainageArea.layerName;
            // feature.attributes.layerName = layerName;
            // drainageArea.popupTemplate = {
            //   // autocasts as new PopupTemplate()
            //   title: 'Title 123',
            //   content: 'Content 345',
            // };
            return drainageArea;
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
        // .then(showPopup)
        .then(function() {
          console.log('then step 3!');
          showWaterwayInfoAndMap();
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

  var zoom = new Zoom({
    view: mapView,
  });
  mapView.ui.add(zoom, 'bottom-right');

  var basemapToggle = new BasemapToggle({
    view: mapView,
    nextBasemap: 'topo',
    // nextBasemap: "streets-relief-vector"
  });
  mapView.ui.add(basemapToggle, 'bottom-right');

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

function showWaterwayInfoAndMap() {
 let waterwayName = "Browns Creek"
 let waterwayStatus = "Unhealthy"
 let problemListHTML = createProblemsLinks(["Altered Streamside Vegetation", "Aluminum"])

 let waterwayInformationHtmlTemplate = `<div class="card-body">
 <div class="waterway-heading">
   <h5 class="text-muted">Waterway Nearest This Address</h5>
   <h3 class="card-title">${waterwayName}</h3>
 </div>

 <div class="waterway-health text-danger">
   <p class="font-weight-bold">Status: <span id="waterway-status">${waterwayStatus}</span></p>
 </div>

 <div class="waterway-problems">
   <p>Select a problem to see how you can help this stream:</p>
   <ul id="waterway-problems-list">
     ${problemListHTML}
   </ul>

 </div>

 <div class="waterway-adopt">
   <h6 class="font-weight-bold">Adopt a Waterway</h6>
   <p>
     Are you a member of an organization that would be interested in adopting this waterway? Contact us at <a href="tel:6158371151">615-837-1151</a>
   </p>

 </div>

 <div class="full-map">
 <a href="#">View water quality map for entire basin</a>
 </div>

 </div>`;

 waterwayInfoDomRef.innerHTML = waterwayInformationHtmlTemplate;
}


function createProblemsLinks(problemList) {
  let listOfLinks = ""
  problemList.forEach(element => {
    let urlExtension = element.toLowerCase().split(" ").join("-")
    listOfLinks += `<li><a href="${crcBaseUrl}${urlExtension}">${element}</a></li>`
  });
  return listOfLinks
}
