//global variables
var map;
var bounds;
var infowindow;


//init function
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 37.308711,
            lng: -122.012604
        },
        zoom: 12
    });

    //initialize the bounds so they can be extended later if needed
    bounds = new google.maps.LatLngBounds();

    //only create one instance of infowindow. This is necessary to prevent multiple info windows opening
    infowindow = new google.maps.InfoWindow();

    //when user click on the map, close the infowindow
    map.addListener('click', function () {
        infowindow.close();
        infowindow.setMarker = null;
    });

    //this binding needs to be in the initMap function
    ko.applyBindings(new ViewModel());

}


//data model
var Shop = function (data) {
    var self = this;
    //data from the data.js file
    this.name = data.name;
    this.lat = data.lat;
    this.lng = data.lng;

    //for marker data
    this.latLng = {
        lat: this.lat,
        lng: this.lng
    };

    this.marker = new google.maps.Marker({
        position: this.latLng,
        map: map,
        title: this.name,
        animation: google.maps.Animation.DROP //the marker will have a drop effect when the page first loaded
    });

    //set visible to true by default
    this.visible = ko.observable(true);

    //use ajax to get more info from four square API for the shop

    //you will need to replace the clientID and clientSecret with your own valid credentials
    var CLIENT_ID = 'YOUR_CLIENT_ID';
    var CLIENT_SECRET = 'YOUR_CLIENT_ID';

    //keep the url in one line. DO NOT break it
    var fourSquareUrl = 'https://api.foursquare.com/v2/venues/search?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=20171130&ll=' + self.lat + ', ' + self.lng + '&query=' + self.name;

    //process the response json data
    $.getJSON(fourSquareUrl, function (returnedJson) {
        //only take the first shop. It may have many shops returning for the venue in the API call
        var returned = returnedJson.response.venues[0]; //only take the first shop.
        //assign the results to the shop model
        self.address = returned.location.address;
        self.city = returned.location.city;
        self.state = returned.location.state;
        self.zip = returned.location.postalCode ? returned.location.postalCode : " ";
        self.phone = returned.contact.formattedPhone ? returned.contact.formattedPhone : "No phone found";
    }).fail(function () {
        alert('Error loading data from Foursquare API!');
    });


    //add the click event listener on the marker to generate the info window on the map
    this.marker.addListener('click', function () {
        populateInfoWindow(this, self.address, self.city, self.state, self.zip, self.phone, infowindow);
        setMarkerAnimation(this);
    });

    //handle the item being selected, trigger the click event on the marker
    this.handleSelect = function () {
        google.maps.event.trigger(self.marker, 'click');
    };

    //extend the global map bounds to the marker's lat/lng
    bounds.extend(self.marker.position);
    map.fitBounds(bounds);


}; //the end of Shop data model


//view model
var ViewModel = function () {

    var self = this;

    //declare observables for the searchItem, and the shopList on the side bar
    this.searchItem = ko.observable('');
    this.shopList = ko.observableArray([]);

    //add shops from data.js to the shopList, create all the Shop objects
    shopsData.forEach(function (shop) {
        self.shopList.push(new Shop(shop));
    });


    //now, filter the shopList on the side bar based on the searchItem
    this.filteredList = ko.computed(function () {
        //set searchItem to lower case
        var filter = self.searchItem().toLowerCase();
        //if no filter, just set all shops in the list to be visible
        if (!filter) {
            self.shopList().forEach(function (shop) {
                shop.visible(true);

            });
            return self.shopList();
        } //end of if
        else { //if there is a filter, then filter the list
            var filtered = ko.utils.arrayFilter(self.shopList(), function (shop) {
                var strShop = shop.name.toLowerCase();
                //set the shop visibility based on whether it includes the filter
                shop.visible(strShop.includes(filter));
                //return true or false for the ko arrayFilter to filter the array
                return strShop.includes(filter);
            });
            //return filtered array
            return filtered;
        } //end of else
    }, self);



}; //the end of ViewModel



/*-------------------Helper Functions---------------------------------------*/

//define infoWindow for the marker
function populateInfoWindow(marker, address, city, state, zip, phone, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent('<div><strong>' + marker.title + '</strong></div>' +
                '<div>' + address + '</div>' +
                '<div>' + city + ', ' + state + ' ' + zip + '</div>' +
                '<div>' + phone + '</div>'
            );

            infowindow.open(map, marker);

            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function () {
                infowindow.setMarker = null;
            });

        } //end of if infowindow.marker

    } //end of populateInfoWindow


//handle google map error
function handleGoogleError() {
        document.getElementById("map").innerHTML = "<p> Error loading the Google Map! </p>";
    } //end of handleGoogleError

//set the animation on the marker
function setMarkerAnimation(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 700);
    }
}