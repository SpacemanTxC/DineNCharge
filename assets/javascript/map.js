// global variables with nominal Austin lat/long for opencharge api call...google maps pin drop outputs to 6 decimal places
let lat = 30.287738;
let long = -97.729001;
//hack we used to make the foursquare markers not output 100 results
let chosen_marker;
let chosen_address;
let chosen_cost;
//once the user click on the map the map will prevent any new ev station markers being created
let station_click = false;
let station_or_rest_info = false;
// API doesn't need a key, current settings: max results=10, distance searched=10, units=miles, export to JSON
  //JSON export file seems to output in order of distance from lat long
let marker_array = [];
let infoWindow_array = [];
let marker_array2 = [];
let infoWindow_array2 = [];

//flag to see if user is using saved locations or not.
let green_marker = false;

let firebase_counter = 0;
//the script that does all the magic
function initMap() {
	//centers map around the texas area
  let myLatlng = {lat: 30.275, lng: -97.730};
  // Initialize Firebase
  let config = {
    apiKey: "AIzaSyBvvEjbSASL1XEzekqx0geFN_oZT6oTToY",
      authDomain: "dinencharge.firebaseapp.com",
      databaseURL: "https://dinencharge.firebaseio.com",
      projectId: "dinencharge",
      storageBucket: "dinencharge.appspot.com",
      messagingSenderId: "376300146566",
      appId: "1:376300146566:web:cb0a52b6a31d3ed2cee607",
      measurementId: "G-EDVFKV9C55"
  };
  firebase.initializeApp(config);

let database = firebase.database();


  let map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: myLatlng
  });
//###############################################################################
  //for loop that goes through each firebase entry
  // creates a function to add the current informaiton from the station address to the mapSiderBar
  database.ref().on("child_added", function(childSnapshot, prevChildKey){
  let dataLocation = childSnapshot.val();
      //add markers to map based on lat and long from firebase
      let rec_marker = new google.maps.Marker({position:{lat: dataLocation.markerLocation.lastLocationLat, lng: dataLocation.markerLocation.lastLocationLong }, map: map, icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'});

      // create a display window for marker
      let contentString2 = "<div><p>This is a highly recommended charging station <br> Address: "+ dataLocation.markerLocation.restaurantAddress+"<br> Cost: "+dataLocation.markerLocation.locationCost+"</p></div>";
      console.log(firebase_counter);

      //add windows to infowindows_array2
      let setDisplay2 = new google.maps.InfoWindow({
        content: contentString2
      });

      infoWindow_array2[firebase_counter] = setDisplay2;


      //add marker to marker_array2
      marker_array2[firebase_counter] = rec_marker;

      firebase_counter++;

      //add listeners event to marker
        //clear windows
        //chose_marker = marker

      rec_marker.addListener( 'click', function(){
        console.log("listener works");
          clearWindows();
          setDisplay2.open(map, rec_marker);
          green_marker = true;
          document.getElementById('station_address').value= dataLocation.markerLocation.restaurantAddress;
          document.getElementById('station_fee').value=  dataLocation.markerLocation.locationCost;
          chosen_marker = rec_marker;
      });
  });





//###############################################################################

    // event listener click for the map to add the
  google.maps.event.addListener(map, 'click', function(event) {
    if(station_click === false){
      clearOverlays();
      // marker = new google.maps.Marker({position: event.latLng, map: map});
      lat = event.latLng.lat();
      long = event.latLng.lng();
      // after lat long
    let queryChargeURL = "https://api.openchargemap.io/v2/poi/?output=json&countrycode=US&maxresults=10&latitude="+lat+"&longitude="+long+"&distance=50&distanceunit=Miles";
    //create event to send lat long to opencharge API
    $.ajax({
      url: queryChargeURL,
      method:"GET"
    })
    .done(function(response){
      for (i =0; i < response.length; i++){
        //create long an lat from the database
        let newLat = response[i].AddressInfo.Latitude;
        let newLong = response[i].AddressInfo.Longitude;
        // var locationMap = response[i].ID;
        let address = response[i].AddressInfo.AddressLine1;
        let cost = response[i].UsageCost;
        chosen_address = address;
        if (cost === null || cost === "undefined"){
          cost = "unknown";
        };
        chosen_cost = cost;

        // Creates markers on the page and stores them in array
        let marker = new google.maps.Marker({position:{lat: newLat, lng: newLong  }, map: map});


           //post new lat and long to a marker
              //div only being run
        let contentString = "<div><p> Address: "  +address+"</p><br><p> Fee: " +cost+"</p></div>";

        let setDisplay = new google.maps.InfoWindow({
          content: contentString
        });

        infoWindow_array[i] = setDisplay;

        marker.addListener( 'click', function(){
            clearWindows();
            setDisplay.open(map, marker);
            document.getElementById('station_address').value= address;
            document.getElementById('station_fee').value= cost;
            chosen_marker = marker;

            // *uncoded* we need to take the aresponse json and pull our desired fields into an array
        //end of marker button
        });

        marker_array[i] = marker;
      //end of the for loop
      }

    });

    station_click = true;
    //this is the closing of the if station_click === false statement.
    }
  // this is the closing of the google maps click listener
  });

  function clearOverlays() {
    for (let i = 0; i < marker_array.length; i++ ) {
      marker_array[i].setMap(null);
    }
    marker_array.length = 0;

    for (let i = 0; i < marker_array2.length; i++ ) {
      marker_array2[i].setMap(null);
    }
    marker_array2.length = 0;
  }

  function clearWindows() {
    for (let i = 0; i < infoWindow_array.length; i++ ) {
      infoWindow_array[i].close();
    }
    for (let i = 0; i < infoWindow_array2.length; i++ ) {
      infoWindow_array2[i].close();
    }

  }

  $("#station_submit").click(function () {
    clearWindows();
    clearOverlays();
    console.log(chosen_marker);
    call_foursquare(chosen_marker);
  });

  //on refresh page button click, reload the page
  $("#refreshPage").click(function () {
    location.reload(true);
  });

  function call_foursquare(marker){
    //builds local queryFoodURL variable for foursquare api call
    marker_array.length = 0;
    infoWindow_array.length = 0;
    let foursquareClient = "G4IC4U00QBF1J4NAJZIMLHTIZC15IDUYDIAAN420YTSIR3WE";
    let foursquareSecret = "OTMNQNDGDXD4TJMP5QB3FENUXIDRWR0YCZHWFQYLIDMIP25G";
    // sets api call to .5 miles (distance in meters)
    let foursquareDistance = 805;
    let foursquareLimit = 20;
    let queryFoodURL = "https://api.foursquare.com/v2/venues/explore?&ll="+marker.position.lat()+","+marker.position.lng()+"&radius="+foursquareDistance+"&section=food&client_id="+foursquareClient+"&client_secret="+foursquareSecret+"&limit="+foursquareLimit+"&v=20171130";
    //ajax call for foursquare that console logs the name of a food place in groups[0]
    $.ajax({
      url: queryFoodURL,
      method:"GET"
    })
    .done(function(aresponse){
      var results =aresponse.response.groups[0].items.length;
      if (results >= 15 && green_marker == false){
        // FIRE BASE Pushes the clicked location to the data base
        // var for location, address, and cost
        var lastLocationLat = marker.position.lat();
        var lastLocationLong = marker.position.lng();
        var storageInfo = {
          markerLocation:{
            lastLocationLat: lastLocationLat,
            lastLocationLong: lastLocationLong,
            restaurantAddress: chosen_address,
            locationCost: chosen_cost

          }
        };
          database.ref().push(storageInfo);
      }
      // creates map flags for foursquare responses
      for (var i=0;i<results;i++) {
        //new scoped variables
        var restName = aresponse.response.groups[0].items[i].venue.name;
        var restCat = aresponse.response.groups[0].items[i].venue.categories[0].shortName;
        var restLat = aresponse.response.groups[0].items[i].venue.location.lat;
        var restLng = aresponse.response.groups[0].items[i].venue.location.lng;
        var restAdd = aresponse.response.groups[0].items[i].venue.location.address;
        // create new set of markers
        let marker2 = new google.maps.Marker({position:{lat: restLat, lng: restLng}, map: map});
         //post new lat and long to a marker
            //div only being run
        let contentString2 = "<div><p> Restaurant Name: "+restName+"</p><br><p>Address: "+restAdd+"</p><br><p> Genre: "+restCat+"</p></div>";
        // console.log("BREAKDANCE");
        let setDisplay2 = new google.maps.InfoWindow({
          content: contentString2
        });
      infoWindow_array[i] = setDisplay2;
      marker_array[i] = marker2;

      marker2.addListener( 'click', function(){
        clearWindows();
        setDisplay2.open(map, marker2);
      });

    }
    //end of ajax done
    });
  //end of call_foursquare
  }
  // issues with getting the data to
  // not saving in the arr but over writes the array

}
