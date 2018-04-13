let crcBaseUrl = 'http://cumberlandriverbasin.org/';

const waterwayInfoDomRef = document.getElementById('waterway-info');
waterwayInfoDomRef.innerHTML = `<div class="card-body"><h3>How Healthy is Your Waterway?</h3><p>The Cumberland River Basin is a vast region that includes 18,000 square miles of land and over 20,000 miles of streams and rivers. The region is one of the most biodiverse on Earth - home to thousands upon thousands of plant and animal species and nearly 3 million people, all of whom depend on clean and abundant water to survive.

Today, thousands of miles of our basin’s waterways are unhealthy. But, it doesn’t have to be this way. Each and every one of us shares a connection with a waterway and a connection to its health. Use iCreek, to uncover your waterway,  determine its health, and to get connected to ideas, people, and resources who can help you promite water quality in your community.</p></div>`;

require([
  // ArcGIS
  'esri/WebMap',
  'esri/views/MapView',
  'esri/layers/GraphicsLayer',
  // Widgets
  // TODO: Remove what we don't use...
  'esri/widgets/Zoom',
  'esri/widgets/Search',
  'esri/widgets/BasemapToggle',
  'esri/widgets/Attribution',

  // Tasks
  'esri/tasks/IdentifyTask',
  'esri/tasks/support/IdentifyParameters',
  'esri/tasks/QueryTask',
  'esri/tasks/support/Query',

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
  GraphicsLayer,
  Zoom,
  Search,
  BasemapToggle,
  Attribution,
  IdentifyTask,
  IdentifyParameters,
  QueryTask,
  Query,
  Collapse,
  Dropdown,
  CalciteMaps,
  CalciteMapArcGISSupport
) {
  var identifyTask, params;

  var cumberlandMapUrl =
    'https://start.gisbiz.com/arcgis/rest/services/cumberland/MapServer';

  var resultsLayer = new GraphicsLayer();

  // Map
  var map = new WebMap({
    portalItem: {
      id: '2dd1e0044d2943779b63612cd9e3bd6e',
    },
    // layers: [resultsLayer],
  });

  // View
  var mapView = new MapView({
    container: 'mapViewDiv',
    map: map,
    padding: {
      top: 10,
      bottom: 10,
      right: 10,
      left: 10,
    },
    ui: { components: [] },
  });

  mapView.when(function() {
    console.log('when!');
    // Create an identify task to locate boundaries
    identifyTask = new IdentifyTask(cumberlandMapUrl);
    params = new IdentifyParameters();
    params.tolerance = 1;
    params.layerIds = [3]; // The drainage polygons layer is found by ID
    params.layerOption = 'all';
    params.returnGeometry = true; // Yes, we need the geometry
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

  // searchWidget.on('search-clear', function(event) {
  //   console.log('Search input textbox was cleared.');
  // });

  searchWidget.on('search-complete', function(event) {
    if (event.results) {
      var result = event.results[0].results[0];
      // resultsLayer.add(result);
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
          if (response.results) {
            var drainageArea = response.results[0];
            var feature = drainageArea.feature;
            var layerName = drainageArea.layerName;
            feature.attributes.layerName = layerName;
            // drainageArea.popupTemplate = {
            //   // autocasts as new PopupTemplate()
            //   title: 'Title 123',
            //   content: 'Content 345',
            // };
            return feature;
          }
        })
        .then(function(feature) {
          // We have the polygon! Zoom to it.
          if (feature.geometry) {
            mapView.goTo(feature.geometry.extent.expand(1.4));
          }

          // Find the stream(s) inside of it.
          // Call ArcGIS Server on all 3 layers: healthy, unhealthy, unassessed
          for (i = 0; i <= 2; i++) {
            var queryTask = new QueryTask({
              url: cumberlandMapUrl + '/' + i, // Note this!
            });
            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ['*']; // TODO: Specify only fields we need.
            query.geometry = feature.geometry; // the drainage polygon
            query.spatialRelationship = 'intersects';

            // When resolved, returns features and graphics that satisfy the query.
            queryTask.execute(query).then(function(results) {
              if (results.features && results.features.length > 0) {
                showWaterwayInfoAndMap(
                  parseData(results.features[0].attributes)
                );
              } else {
                showMessageNothingFound();
              }
            });

            // When resolved, returns a count of features that satisfy the query.
            queryTask.executeForCount(query).then(function(count) {
              console.log(count + ' features found');
            });
          }
          showWaterwayInfoAndMap();

          function showWaterwayInfoAndMap(waterwayObject) {
            let waterwayName = waterwayObject.name;
            let waterwayStatus = waterwayObject.status;
            let problemListHTML = createProblemsLinks(waterwayObject.problems);

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

          function parseData(dataObject) {
            console.log('data', dataObject);
            let arrayOfPopupInfo = dataObject.PopupInfo.split(': ');
            let status = arrayOfPopupInfo[1].split('<br>');
            let problems = arrayOfPopupInfo[2].split('<br>');
            console.log('status', status[0]);
            console.log('problems', problems[0]);
            let parsedWaterwayObject = {
              name: dataObject.Name,
              status: status[0],
              problems: problems[0].split(', '),
            };
            return parsedWaterwayObject;
          }

          function createProblemsLinks(problemList) {
            let listOfLinks = '';
            problemList.forEach(element => {
              let urlExtension = element
                .toLowerCase()
                .split(' ')
                .join('-');
              listOfLinks += `<li><a href="${crcBaseUrl}${urlExtension}">${element}</a></li>`;
            });
            return listOfLinks;
          }

          function showMessageNothingFound() {
            waterwayInfoDomRef.innerHTML =
              '<h3>No waterways found in this drainage area. Please try another address.</h3>';
          }
        });
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
