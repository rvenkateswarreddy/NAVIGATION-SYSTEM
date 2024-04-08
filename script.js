mapboxgl.accessToken = 'pk.eyJ1Ijoic2FpY2hhcmFuZ2VvbWFwcyIsImEiOiJjbHU4NnF5aGkwZDV5MmxsbDZsamNvbWtxIn0.Fc0DIWkhYaLdTo5ifGIxYg';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/saicharangeomaps/clu86uu3u00eg01qr17cocxgt',
    center: [79.40304594470149, 13.629167029492834],
    zoom: 18.228649883196468,
    bearing: 163.19999999999845,
    pitch: 59.499999999999986
});

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

let startPoint = null;
let endPoint = null;
let movementMarker = null;

map.on('load', function() {
    initializeMovementMarker();

    map.on('click', function(e) {
        const coordinates = [e.lngLat.lng, e.lngLat.lat];
        
        if (!startPoint) {
            startPoint = coordinates;
            addMarker(startPoint, 'start');
        } else if (!endPoint) {
            endPoint = coordinates;
            addMarker(endPoint, 'end');
            getDirections(startPoint, endPoint);
        } else {
            startPoint = coordinates;
            endPoint = null;
            clearMarkers();
            addMarker(startPoint, 'start');
        }
    });
});

function addMarker(coordinates, type) {
    const el = document.createElement('div');
    el.className = `marker ${type === 'start' ? 'start-marker' : 'end-marker'}`;
    
    new mapboxgl.Marker(el).setLngLat(coordinates).addTo(map);
}

function initializeMovementMarker() {
    if (movementMarker === null) {
        const el = document.createElement('div');
        el.className = 'marker movement-marker';
        el.style.backgroundColor = 'blue';
        el.style.borderRadius = '50%';
        el.style.width = '20px';
        el.style.height = '20px';
        movementMarker = new mapboxgl.Marker(el).setLngLat([0, 0]).addTo(map);
    }
}

function clearMarkers() {
    document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());
}




document.getElementById('search').addEventListener('click', function() {
  const startInput = document.getElementById('start').value;
  const endInput = document.getElementById('end').value;

  Promise.all([geocode(startInput), geocode(endInput)])
      .then(([startCoord, endCoord]) => {
          getDirections(startCoord, endCoord);
      })
      .catch(error => console.error('Error in geocoding:', error));
});

function geocode(location) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxgl.accessToken}&limit=1`;
  return fetch(url)
      .then(response => response.json())
      .then(data => {
          if (data.features && data.features.length > 0) {
              return data.features[0].center;
          } else {
              throw new Error('Location not found');
          }
      });
}





async function getDirections(start, end) {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(',')};${end.join(',')}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
    const response = await fetch(url);
    const data = await response.json();
    const route = data.routes[0].geometry;
    const directions = data.routes[0].legs[0].steps.map(step => step.maneuver.instruction);

    if (map.getSource('route')) {
        map.getSource('route').setData(route);
    } else {
        map.addSource('route', {
            type: 'geojson',
            data: route
        });
        map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#888',
                'line-width': 8
            }
        });
    }

    displayNavigationInstructions(directions);
    simulateMovement(route.coordinates);
}

function displayNavigationInstructions(directions) {
    const instructionsElement = document.getElementById('navigation-instructions');
    instructionsElement.innerHTML = '<h3>Navigation Instructions</h3>';
    directions.forEach(instruction => {
        const instructionElement = document.createElement('p');
        instructionElement.textContent = instruction;
        instructionsElement.appendChild(instructionElement);
    });
}

function simulateMovement(routeCoordinates) {
    let step = 0;

    function move() {
        if (step < routeCoordinates.length) {
            movementMarker.setLngLat(routeCoordinates[step]);
            map.panTo(routeCoordinates[step]);
            step += 10; // Adjust step size as needed for smoother or faster movement
            setTimeout(move, 1000); // Adjust timeout for movement speed
        }
    }

    move();
}
