
var map = null;

akme.onLoad(function() {
	var form = document.forms["go"];
	var frame = document.getElementById("census-data");
	akme.onEvent(form.elements["censusType"], "change", function(ev) {
		frame.src = ev.target.options[ev.target.selectedIndex].value;
	});
	akme.onEvent(frame, "load", function(ev) {
		CensusData.load();
		getFusionTablesData(form);
	});
	
	CensusData.load();
		
	// 43.64856,-79.385324 : Toronto, Ontario 
	// 49.89944,-97.140794 : Winnipeg, Manitoba
	var mapOpts;
	
	/*
	if (form.zoom.value && parseFloat(form.lat0.value) >= -180) {
		var bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(form.lat0.value, form.lon0.value), // SW
				new google.maps.LatLng(form.lat1.value, form.lon1.value)); // NE
		mapOpts = {
	      		zoom: parseInt(form.zoom.value),
	      		center: bounds.getCenter(),
	      		mapTypeId: google.maps.MapTypeId.ROADMAP
	    	};
	} else {
		mapOpts = {
      		zoom: 8,
      		center: new google.maps.LatLng(43.64856,-79.385324),
      		mapTypeId: google.maps.MapTypeId.ROADMAP
    	};
	}
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOpts);
	*/
	
	if (form.zoom.value && parseFloat(form.lat0.value) >= -180) {
		var bounds = new L.LatLngBounds(
				new L.LatLng(form.lat0.value, form.lon0.value), // SW
				new L.LatLng(form.lat1.value, form.lon1.value)); // NE
		mapOpts = {
	      		zoom: parseInt(form.zoom.value),
	      		center: bounds.getCenter()
			};
	} else {
		mapOpts = {
      		zoom: 8,
      		center: null, // new L.LatLng(43.64856,-79.385324)
    	};
	}
	map = new L.Map(document.getElementById("map_canvas"), mapOpts);
	var tiles = new L.TileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
		attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
		subdomains: '1234'
	});
	map.addLayer(tiles);
	var markerSize = new L.Point(13, 16);
	MarkerIcon = L.Icon.extend({
		iconUrl: 'document.gif',
		shadowUrl: null,
		iconSize: markerSize,
		shadowSize: null,
		iconAnchor: new L.Point(markerSize.x/2-1, markerSize.y/2)
	});
	
	
    setMarkers(map, markerAry);
    var eventHandler = function() {
    	var form = document.forms["go"];
        form.zoom.value = map.getZoom();
    	var bounds = map.getBounds();
    	form.lat0.value = bounds.getSouthWest().lat; // Google lat()
    	form.lon0.value = bounds.getSouthWest().lng;
    	form.lat1.value = bounds.getNorthEast().lat;
    	form.lon1.value = bounds.getNorthEast().lng;
    };
	map.on('zoomend', eventHandler);
	map.on('moveend', eventHandler);
	map.on('dragend', eventHandler);
	/*
    google.maps.event.addListener(map, 'zoom_changed', eventHandler);
    google.maps.event.addListener(map, 'bounds_changed', eventHandler);
	*/

});

var MIN_WIDTH = 15;
var IMG_WIDTH_DIV = 48;
var MarkerIcon;
var statRangeMap = {"pop_per_sq_km": 4000.0, "pop_change": 4000.0, "pop_change_pct": 200.0};
var censusTypeImgMap = {"CT":"CT_SR"};
var censusType = "CT";
var markerList = [];
var polygonList = [];
var markerInfoList = [];
var markerInfoWindow = new L.Popup({content: ""});
/*
var markerInfoWindow = new google.maps.InfoWindow({
	content: ""
});
*/
/*
		var scaledSize = new google.maps.Size(size, size);
		var marker = new google.maps.Marker({
			map: map,
			position: new google.maps.LatLng(lat0lon1[0],lat0lon1[1]),
			icon: new google.maps.MarkerImage( 
					IMG_WIDTH_ARY[Math.min(Math.floor(size/IMG_WIDTH_DIV), 2)],
					null,null,new google.maps.Point(size/2, size/2),scaledSize),
			title: lat0lon1[4]+" area "+ akme.round3(area) +" population "+ stat +" density "+ akme.round3(stat/area) });

		var circle = new google.maps.Circle({map:map, radius:size/2,
			center:new google.maps.LatLng(lat0lon1[0],lat0lon1[1]),
			fillColor:"#C5D3ED", fillOpacity:0.6,
			strokeColor:"#325693", strokeOpacity:0.6, strokeWeight:2});
	 	google.maps.event.addListener(marker, 'mouseover', function() { alert(markerInfoList[i]); });
	 	google.maps.event.addListener(marker, 'mouseout', function() { ; });
 */
function setMarkers(map, markerAry /* Object[][] */) {
	var form = document.forms["go"];
	var elem = form.elements["statName"];
	var statName = elem.options[elem.selectedIndex].value;
	if (markerAry) {
		document.getElementById("foundLocations").textContent = markerAry.length;
	}
	if (markerAry) for (var i=0; i<markerAry.length; i++) {
		var lat0lon1 = markerAry[i];
		if (!lat0lon1) continue;
		var area = Number(lat0lon1[2]);
		var pop = Number(lat0lon1[3]);
		var stat = Number(lat0lon1[4]);
		// a=Math.PI*((d/2)^2)
		//var size = new google.maps.Size(13, 16);

		// 0=red, 240=blue
		// density 4000=Toronto, red
		// density 5000=Vancouver
		var statMax = statRangeMap[statName];
		var density = (pop/area).toFixed(3); // toPrecision
		var factor = 240 - (Math.log(stat > 0 ? stat : 0)*240/Math.log(statMax));
		if (factor > 240) factor = 240;
		if (factor < 0) factor = 0;
		var hue = -8.0*Math.sin( 8.0*Math.PI/240.0*factor ) + factor;
		var color = "#"+rgb2hex(hsv2rgb([hue,90,90]));
		
		// map.latLngToLayerPoint(latLng) // convert LatLng to Point for CircleMarker
		var latLng = new L.LatLng(lat0lon1[0],lat0lon1[1]);
		var marker = new L.Marker(latLng, {
			icon: new MarkerIcon(),
			title: lat0lon1[6]+": area "+ area.toFixed(3) +"; population "+ pop +"; density "+ density 
				+"; "+ statName +" "+ stat
		});
		map.addLayer(marker);

		var circle = new L.Circle(latLng, Math.sqrt(area/Math.PI)*1000, {
			fillColor:color, fillOpacity:0.6,
			color:"#800080", opacity:0.6, weight:2
		});
		map.addLayer(circle);
		setMarkerInfo(marker, markerInfoList.length, circle);
		/*
		var marker = new google.maps.Marker({
			map: map,
			position: new google.maps.LatLng(lat0lon1[0],lat0lon1[1]),	
			icon: new google.maps.MarkerImage( 
					"document.gif", // IMG_WIDTH_ARY[Math.min(Math.floor(size/IMG_WIDTH_DIV), 2)],
					null,null,new google.maps.Point(size.width/2-1, size.height/2),size),
			//shape: {coords:[0,0,Math.sqrt(area/Math.PI)*1000], type:"circle"},
			title: lat0lon1[6]+": area "+ area.toFixed(3) +"; population "+ pop +"; density "+ density 
				+"; "+ statName +" "+ stat});

		var circle = new google.maps.Circle({map: map, radius: Math.sqrt(area/Math.PI)*1000,
			fillColor:color, fillOpacity:0.6,
			strokeColor:"#800080", strokeOpacity:0.6, strokeWeight:2});
		circle.bindTo('center', marker, 'position');

		setMarkerInfo(marker, markerInfoList.length, circle);
		*/
		
		markerList[markerList.length]=(marker);
		markerInfoList[markerInfoList.length]=(
			lat0lon1[6]
			+"<br/><a href='http://www12.statcan.gc.ca/census-recensement/2011/dp-pd/prof/search-recherche/frm_res_geocode.cfm?Lang=E&TABID=3&SearchText="+ lat0lon1[5] +"' target='_blank'>view at statcan.gc.ca</a>"
			+"<br/>area "+ area.toFixed(3) 
			+"<br/>population "+ pop 
			+"<br/>density "+ density
			+"<br/>"+ statName +" "+ stat);
		polygonList[polygonList.length]=(circle);
	}
	function setMarkerInfo(marker, markerInfoIdx, circle) {
		// somehow this needs to be a separate function outside the loop.
		var markerEvent = function() { 
			markerInfoWindow.setContent(markerInfoList[markerInfoIdx]);
			markerInfoWindow.setLatLng(marker.getLatLng());
			map.openPopup(markerInfoWindow);
			//markerInfoWindow.open(marker.get("map"), marker);
		};
		marker.on("click", markerEvent);
		circle.on("click", markerEvent);
		//google.maps.event.addListener(marker, "click", markerEvent);
		//google.maps.event.addListener(circle, "click", markerEvent);
	}
}

function clearMarkers() {
	for (var i=0; i<markerList.length; i++) { 
		map.removeLayer(markerList[i]);
		//google.maps.event.clearInstanceListeners(markerList[i]); 
		//markerList[i].setMap(null); 
	}
	for (var i=0; i<polygonList.length; i++) {
		map.removeLayer(polygonList[i]);
		//google.maps.event.clearInstanceListeners(polygonList[i]); 
		//polygonList[i].setMap(null); 
	}
	markerList.length = 0;
	markerInfoList.length = 0;
	polygonList.length = 0;
}

var markerAry = [
];

var MAX_RESULTS = 100;

function getFusionTablesData(form) {
	try {
	    var bounds = map.getBounds(); // Google lat()
		var swLat = bounds.getSouthWest().lat, swLon = bounds.getSouthWest().lng, 
			neLat = bounds.getNorthEast().lat, neLon = bounds.getNorthEast().lng;
		clearMarkers();
		var elem = form.elements["statName"];
		var statName = elem.options[elem.selectedIndex].value;
		var markerAry = [];
		var data = CensusData.data;
		for (var i=0; i<data.content.length && markerAry.length < MAX_RESULTS; i++) { 
			var lat = data.get(i,"latitude"), lon = data.get(i,"longitude");
			if (lat < swLat || lat > neLat || lon < swLon || lon > neLon) continue;
			markerAry[markerAry.length] = [
				lat, lon,
				data.get(i,"land_sq_km"), // area
				data.get(i,"pop_this"), // population
				data.get(i,statName), // statName: pop_this, pop_per_sq_km, pop_change, pop_change_pct
				data.get(i,"census_cd"),
				"C#"+ data.get(i,"census_cd") +", "+ data.get(i,"region_sub_cd")+", "+ data.get(i,"province_cd") // name
			];
		}
		setMarkers(map, markerAry);
	}
	catch (er) { alert(String(er)); }
	return;
	
	// Use the Google Data Visualization API to get Fusion Table data for custom mapping.
	var tableid = 395529;
	var qry = new google.visualization.Query(
			"http://www.google.com/fusiontables/gvizdata?tq=" +
			escape("SELECT censusCd FROM "+ tableid +
			" WHERE ST_INTERSECTS(latitude, RECTANGLE(LATLNG("+ form.lat0.value +","+ form.lon0.value +
			"), LATLNG("+ form.lat1.value +","+ form.lon1.value +")))" +
			" LIMIT "+ (MAX_RESULTS+1)) );
	qry.send(receiveGoogleData);
}

// Callback for Google Data Vis API response
function receiveGoogleData(response) {
	// @see: http://code.google.com/apis/visualization/documentation/reference.html#QueryResponse
	var dt = response.getDataTable();
	if (dt != null) {
		var numRows = dt.getNumberOfRows();
		var numCols = dt.getNumberOfColumns();
		var censusCdAry = [];
		for (var i=0; i<numRows; i++) {
			// prepare data to be retrieved via POST instead of including from the server-side
			censusCdAry.push(dt.getValue(i,0));
		}
	}
}

var CensusData = {
	data : {element:"census-data", headers:{}, content:[]},
	load : function() {
		var self = this;
		var elems = ["data"];
		function getter(row,col) {
			return this.content[row][typeof col == "string" || col instanceof String ? this.headers[col] : col];
		};
		for (var i=0; i<elems.length; i++) {
			var obj = self[elems[i]];
			obj.get = getter;
			var frame = document.getElementById(obj.element);
			var text = frame.contentDocument.body.firstChild.innerHTML;
			var idx = text.indexOf("\n");
			var rows = text.split(idx > 1 && text.charAt(idx-1) == "\r" ? "\r\n" : "\n");
			if (rows.length > 0) {
				if (rows[rows.length-1].length == 0) rows.length = rows.length-1;
				var row = rows.shift().split("\t");
				for (var j=0; j<row.length; ++j) obj.headers[row[j]] = j;
				for (var j=0; j<rows.length; ++j) rows[j] = rows[j].split("\t");
				obj.content = rows;
			}
		}
	}
}


function hsv2rgb(hsv) {
    var red, grn, blu, i, f, p, q, t;
    var hue = hsv[0]%360;
    if (hsv[2]==0) return [0, 0, 0];
    var sat = hsv[1]/100;
    var val = hsv[2]/100;
    var hue = hue/60;
    i = Math.floor(hue);
    f = hue-i;
    p = val*(1-sat);
    q = val*(1-(sat*f));
    t = val*(1-(sat*(1-f)));
    if (i==0) {red=val; grn=t; blu=p;}
    else if (i==1) {red=q; grn=val; blu=p;}
    else if (i==2) {red=p; grn=val; blu=t;}
    else if (i==3) {red=p; grn=q; blu=val;}
    else if (i==4) {red=t; grn=p; blu=val;}
    else if (i==5) {red=val; grn=p; blu=q;}
    red = Math.floor(red*255);
    grn = Math.floor(grn*255);
    blu = Math.floor(blu*255);
    return [red, grn, blu];
}
//
function rgb2hsv(rgb) {
    var x, val, f, i, hue, sat, val;
    var red = rgb[0]/255;
    var grn = rgb[1]/255;
    var blu = rgb[2]/255;
    x = Math.min(Math.min(red, grn), blu);
    val = Math.max(Math.max(red, grn), blu);
    if (x==val) return [undefined, 0, val*100];
    f = (red == x) ? grn-blu : ((grn == x) ? blu-red : red-grn);
    i = (red == x) ? 3 : ((grn == x) ? 5 : 1);
    hue = Math.floor((i-f/(val-x))*60)%360;
    sat = Math.floor(((val-x)/val)*100);
    val = Math.floor(val*100);
    return [hue, sat, val];
}
//
function rgb2hex(rgb) {
	return toHex(rgb[0])+toHex(rgb[1])+toHex(rgb[2]);
}
//
function toHex(n) {
	if (n==null) return "00";
	n=parseInt(n); if (n==0 || isNaN(n)) return "00";
	n=Math.max(0,n); n=Math.min(n,255); n=Math.round(n);
	return "0123456789ABCDEF".charAt((n-n%16)/16)
    	+ "0123456789ABCDEF".charAt(n%16);
}
