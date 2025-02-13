!function($) {
    "use strict";
    var salesData = {
	  "Africa": 3455,
	  "AL": 11.58,
	  "DZ": 158.97,
	  "US": 1000000,
	  "RU": 5488,
	  "IN": 98765,
	  "UK": 5467,
	  'CN': 7777,
	  'UAE': 98654,
	  'SA': 54678
	};
    $('#sales_db_world_map').vectorMap({
    map: 'world_mill',
    series: {
      regions: [{
        values: salesData,
        scale: ['#ECECEC', '#ECECEC'],
        normalizeFunction: 'polynomial',
      }]
    },
    onRegionTipShow: function(e, el, code){
      // el.html(el.html()+' ('+salesData[code]+' Sales)');
    if(salesData[code] === undefined) {
	    el.html('<h6>'+ el.html() + '</h6><p>'+'No Branch Here</p>').css({"font-size":"15px", "color":"#5B6670"});
	}else{
	   //label.html( '<b>'+label.html()+' - '+country.en+'</b>');
       el.html('<h6>'+ el.html() + '</h6><p>'+salesData[code]+' Sales</p>').css({"font-size":"15px", "color":"#5B6670"});
       //el.html('<div id="sales-map-popop">'+ el.html() + '</h6><p id="popop" class="text-center">'+salesData[code]+' Sales</p></div>').css({"font-size":"15px", "color":"#5B6670"});
	}
    },
    hoverOpacity : 0.7,
	hoverColor : true,
	regionStyle : {
		initial : {
			fill : '#ECECEC'
		},
		hover: {
			"fill-opacity": 1,
            "fill": '#FF9F43',
            "stroke": '#FF9F43'
        },
		selected: {
	        fill: '#F4A582'
	    },
	},
    backgroundColor : 'transparent'
  });
	
	// $('#world_map').vectorMap({
	// 	map: 'world_mill',
	// 	scaleColors : ['#03a9f4', '#03a9f4'],
	// 	normalizeFunction : 'polynomial',
	// 	hoverOpacity : 0.7,
	// 	hoverColor : false,
	// 	regionStyle : {
	// 		initial : {
	// 			fill : '#7638ff'
	// 		}
	// 	},
	// 	backgroundColor : 'transparent'
	// });
	
}(window.jQuery)
