export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZGV2MjkiLCJhIjoiY2twZnlwdXJxMG51bjJ2bzQzNHczOXJoZSJ9.WWes5BD7eInKOE0IQWyiEA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/dev29/ckpfzu39g1q2l19lxxy8mjkio',
    scrollZoom: false,
    // center: [78.9629, 20.5937],
    // zoom: 6,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker class which is green loc. logo which is actually comming from css and not map box check style.css and marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //extent map bound to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
