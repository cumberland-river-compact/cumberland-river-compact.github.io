let crcBaseUrl = 'http://cumberlandriverbasin.org/';

const waterwayInfoDomRef = document.getElementById('waterway-info');

waterwayInfoDomRef.innerHTML = `<div class="card-body"><h3 class="title">Is Your Waterway Healthy?</h3><p>The Cumberland River Basin includes 18,000 square miles of land and 20,000 miles of streams and rivers. The region is one of the most biodiverse on Earth - home to thousands of plant and animal species and nearly 3 million people, all of whom depend on water to survive.
</p><p>
Today, thousands of miles of our basin’s waterways are unhealthy. But, it doesn’t have to be this way. Each of us shares a connection with a waterway and a connection to its health. Using iCreek, you can uncover your waterway, determine its health, and get connected to ideas, people, and resources who can help you promote water quality in your community</p></div>`;

require([
  // ArcGIS
  'esri/WebMap',
  'esri/views/MapView',
  'esri/layers/GraphicsLayer',
  'esri/Graphic',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleMarkerSymbol',

  // Widgets
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
  Graphic,
  SimpleFillSymbol,
  SimpleLineSymbol,
  SimpleMarkerSymbol,
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

  // var graphicsLayer = new GraphicsLayer();

  // Map
  var map = new WebMap({
    portalItem: {
      id: '2dd1e0044d2943779b63612cd9e3bd6e',
    },
    // layers: [graphicsLayer],
  });

  // View
  var mapView = new MapView({
    container: 'mapViewDiv',
    map: map,
    padding: {
      top: 70,
      bottom: 10,
      right: 10,
      left: 120,
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

  var markerSymbol = {
    type: 'simple-marker', // autocasts as new SimpleMarkerSymbol() ?
    color: [226, 119, 40],
    outline: {
      // autocasts as new SimpleLineSymbol()
      color: [255, 255, 255],
      width: 2,
    },
  };

  var searchWidget = new Search({
    container: 'searchWidgetDiv',
    view: mapView,
    // allPlaceholder: 'Find an address or place',
    locationEnabled: true,
    maxSuggestions: 3,
    minSuggestCharacters: 2,
    maxResults: 1,
    searchAllEnabled: false,
    resultGraphicEnabled: true,
    resultSymbol: markerSymbol,
  });

  // searchWidget.on('search-clear', function(event) {
  //   console.log('Search input textbox was cleared.');
  // });

  searchWidget.on('search-complete', function(event) {
    waterwayInfoDomRef.innerHTML = `<h3>Searching...</h3>`
    if (event.results) {
      var result = event.results[0].results[0];
      // graphicsLayer.add(result);
      console.log('Name: ', result.name);
      console.log('Location: ', result.feature);

      var pointGraphic = new Graphic({
        geometry: result.feature.geometry,
        symbol: markerSymbol,
      });
      // searchWidget.resultGraphic = pointGraphic; // TODO: Fix this

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
          // We have the polygon! Zoom to it, highlight it!
          if (feature.geometry) {
            mapView.goTo(feature.geometry.extent.expand(1.4));

            var fillSymbol = {
              type: 'simple-fill', // autocasts as new SimpleFillSymbol()
              color: [168, 0, 132, 0.15],
              outline: {
                // autocasts as new SimpleLineSymbol()
                color: [168, 0, 132, 0.79],
                width: 4,
              },
            };

            var polygonGraphic = new Graphic({
              geometry: feature.geometry,
              symbol: fillSymbol,
            });

            mapView.graphics.add(polygonGraphic);
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
              }
            });

            // When resolved, returns a count of features that satisfy the query.
            queryTask.executeForCount(query).then(function(count) {
              console.log(count + ' features found');
            });
          }

          function showWaterwayInfoAndMap(waterwayObject) {
            console.log("waterwayObject", waterwayObject);
            
            let waterwayName = waterwayObject.name;
            let waterwayStatus = waterwayObject.status;

            // let waterwayStatusColorClass = getWaterwayStatusColorClass(waterwayStatus);
            // console.log("waterwayStatusColorClass", waterwayStatusColorClass);
            
            // let waterwayProblems = waterwayObject.problems


            let waterwayInformationHtmlTemplate = `<div class="card-body">
            <div class="waterway-heading">
              <h4><small>Rain at this location drains to: </small></h4>
              <h2 class="card-title" id="connectTo">${waterwayName}</h2>
            </div>
            <hr class="full-line">
            <div class="waterway-health">
              <p class="font-weight-bold"><strong>Status: </strong><span id="waterway-status">${waterwayStatus}</span></p>
            </div>`
            console.log("html", waterwayInformationHtmlTemplate);

            if(waterwayObject.problems.length > 0){
              let problemListHTML = createProblemsLinks(waterwayObject.problems);
              waterwayInformationHtmlTemplate +=`<div class="waterway-problems">
                <p>Select a problem to see how you can help this stream:</p>
                <ul id="waterway-problems-list">
                  ${problemListHTML}
                </ul>
              </div><hr class="full-line">`
            }
            

            waterwayInformationHtmlTemplate +=`<div class="full-map">
            <a href="#">View water quality map for entire basin</a>
            </div>
            <div class="waterway-adopt">
              <p>Interested in adopting this waterway? Call the Compact: <a href="tel:6158371151">615-837-1151</a></p>
            </div>
            </div>`;

            console.log("html", waterwayInformationHtmlTemplate);
            

            waterwayInfoDomRef.innerHTML = waterwayInformationHtmlTemplate;
          }

          function parseData(dataObject) {
            console.log('data', dataObject);
            let arrayOfPopupInfo = dataObject.PopupInfo.split(': ');
            let status = arrayOfPopupInfo[1].split('<br>');
            console.log('status', status[0]);
            
            let parsedWaterwayObject = {
              name: dataObject.Name,
              status: status[0], 
              problems: []
            };

            if(parsedWaterwayObject.status.toLowerCase() === "unhealthy"){
              let problems = arrayOfPopupInfo[2].split('<br>');
              console.log('problems', problems[0]);
              parsedWaterwayObject.problems = problems[0].split(', ')
            } 
            
            return parsedWaterwayObject;
          }

          function createProblemsLinks(problemList) {
            let listOfLinks = '';
            problemList.forEach(element => {
              let urlExtension = element
                .toLowerCase()
                .split(' ')
                .join('-');
              listOfLinks += `<li><a href="${crcBaseUrl}${urlExtension}" target="_blank">${element}</a></li>`;
            });
            return listOfLinks;
          }

          function showMessageNothingFound() {
            waterwayInfoDomRef.innerHTML =
              '<h3>No waterways found in this drainage area. Please try another address.</h3>';
          }

          function getWaterwayStatusColorClass(status) {

            console.log("status", status);
            let lowerStatus = status.toLowerCase()
            if(lowerStatus === "unhealthy"){
              return "text-danger"
            } else if(lowerStatus === "healthy"){
              return "text-success"
            } else {
              return 'text-dark';
            }
          }
        });
    }
  });

  var zoom = new Zoom({
    view: mapView,
  });
  mapView.ui.add(zoom, 'top-right');

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
