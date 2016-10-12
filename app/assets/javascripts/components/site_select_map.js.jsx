var SiteSelectMap = React.createClass({
  getInitialState: function () {
    return {
      query: {},
      selectedSites: [],
      markers: [],
    };
  },

  componentDidMount: function () {
    window.loadMap = this.loadMap;
    SiteDataStore.addChangeListener(this.loadMarkers);
    StateStore.addChangeListener('siteSelectChange', this.updateMarkers);
    SitesAPIUtil.fetchSiteMetadata();
  },

  loadMap: function () {
    this.setState({
      map: new google.maps.Map(document.getElementById('map_canvas'), {
        center: { lat: 37.945, lng: -97.648, },
        zoom: 4,
      }),
    });
    google.maps.event.addListener(this.state.map, 'mousedown', this.mapClick);
  },

  loadMarkers: function () {
    this.addMarkers(SiteDataStore.siteMetaData());
    this.forceUpdate();
  },

  addMarkers: function (siteData) {
    var markers = [];
    for (i = 0; i < siteData.length; i++) {
      var position = new google.maps.LatLng(siteData[i].lat, siteData[i].lng);
      marker = new google.maps.Marker({
        position: position,
        map: this.state.map,
        title: siteData[i].site_name,
        id: siteData[i].id,
        icon: siteData[i].icon,
      });
      google.maps.event.addListener(marker, 'click', (function (siteId) {
            return function () {
              StateStore.toggleSite(siteId);
              this.updateMarkers();
            }.bind(this);
          }.bind(this)(siteData[i].id)));
      markers.push(marker);
    }

    this.setState({ markers: markers });
  },

  updateMarkers: function () {
    newSelection = StateStore.selectedSites();
    var added = newSelection.select(function (siteId) {
      return !this.state.selectedSites.includes(siteId);
    }.bind(this));

    var removed = this.state.selectedSites.select(function (siteId) {
      return !newSelection.includes(siteId);
    }.bind(this));

    this.setState({ selectedSites: StateStore.selectedSites() });
    this.updateColors(added, removed);
  },

  updateColors: function (added, removed) {

    this.state.markers.forEach(function (marker) {
      if (added.includes(marker.id)) {
        marker.setIcon(SiteConstants.GCHART_LINK + 'F00|8|h|F00|b|O');
      } else if (removed.includes(marker.id)) {
        marker.setIcon(SiteConstants.GCHART_LINK + '000|8|h|000|b|O');
      }
    }.bind(this));
  },

  mapClick: function (evt) {
    if (StateStore.isHeld(StateConstants.KEY_CODES.SHIFT)) {
      this.setState({
        rectangle: new google.maps.Rectangle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          map: this.state.map,
          bounds: {
            north: evt.latLng.lat(),
            south: evt.latLng.lat(),
            east: evt.latLng.lng(),
            west: evt.latLng.lng(),
          },
        }),
      });
      google.maps.event.addListener(this.state.map, 'mousemove', function (evt) {
        debugger
        this.state.rectangle.setOptions({
          bounds: {
            south: evt.latLng.lat(),
            east: evt.latLng.lng(),
          },
        });
      }.bind(this));
    }
  },

  render: function () {
    return (
      <div
        id="map_canvas"
        style={{ height: '100%', width: '100%' }}>
      </div>
    );
  },

});