// our input dataset, cleaned slightly
d3.csv("all_mov.csv", function(dataset) {

  var gsw = _.filter(dataset, function(obj) { return obj["Team1"] == "Golden State Warriors"})

  console.log(gsw)

  // // // 

  var totalWidth = d3.select("#chart").node().getBoundingClientRect().width;
  var height = 200;
  var margin = {left: 50, right: 50, top: 60, bottom: 20}; 
  var width = totalWidth - margin.left - margin.right;

  var grouped = [];
  var teams = _.uniq(_.pluck(dataset, 'Team1'));

  for (var i = 0; i < teams.length; i++) {
    nest = _.sortBy(_.filter(dataset, function(obj) { return obj["Team1"] == teams[i]; }), 
    	function(game) { return new Date(game.date); });
    for (var j = 0; j < nest.length; j++) {
      nest[j].order = j;
    }
    grouped.push({teamname: teams[i], data: nest});
  }

  var svg = d3.select("#chart").selectAll("svg")
        .data(grouped)
        .enter()
        .append("div")
        .attr("class", function(d) { return "team" })
       	.attr("id", function(d) { return d.teamname.replace(/ /g, ""); })
        .append("svg:svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    var num_games = _.max(_.map(grouped, function(obj) { return obj.data.length; }));
    var largest_mov = _.max(_.map(dataset, function(obj) { return parseInt(obj["MOV"]); }));
    var xScale = d3.scaleBand().range([0, width]).paddingInner(0.2)
    var yScale = d3.scaleLinear().domain([0, largest_mov]).range([0, height/2])

    // http://bl.ocks.org/pnavarrc/20950640812489f13246
    // Create the svg:defs element and the main gradient definition.
    var svgDefs = svg.append('defs');

	positiveGradient = svgDefs.append("linearGradient")
      .attr("id", "positiveGradient")
      // .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%").attr("y1", "100%")
      .attr("x2", "0%").attr("y2", "0%")
    .selectAll("stop")
      .data([
        {offset: "100%", color: "navy"},
        {offset: "0%", color: "white"}
      ])
    .enter().append("stop")
      .attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });

    negativeGradient = svgDefs.append("linearGradient")
      .attr("id", "negativeGradient")
      // .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%")
    .selectAll("stop")
      .data([
        {offset: "0%", color: "white"},
        {offset: "100%", color: "#c0392b"}
      ])
    .enter().append("stop")
      .attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });

	function mouseover(d) {
	  	tooltip.style("display", "inline");
	}

	function mousemove(d) {
		tooltip
		.text(function() { return d.Team2.toUpperCase() + " // " + d.PTS1 + "-" + d.PTS2; })
    	.style("left", (d3.event.pageX - 34) + "px")
    	.style("top", (d3.event.pageY - 12) + "px");

	}

	function mouseout(d) {
	  	tooltip.style("display", "none");
	}

    var yAxis = d3.axisLeft(yScale).ticks(3)
    svg.append("g")
	    .call(yAxis) 
	    .attr("transform", "translate(" + (margin.left - 5) + "," + (height/2 + margin.top) + ")")
	    .attr("class", "axis yaxis");

	var yAxis = d3.axisLeft(yScale.range([height/2, 0])).ticks(3)
    svg.append("g")
	    .call(yAxis) 
	    .attr("transform", "translate(" + (margin.left - 5) + "," + margin.top + ")")
	    .attr("class", "axis yaxis");

	svg.selectAll(".team")
	    .data(function(d) { xScale.domain(_.pluck(d.data, "order")); return d.data; })
	    .enter().append("rect") 
	    .attr("class", function(d) {
	    	if (d.MOV > 0) {
	    		return d.Team1.replace(/ /g, "") + "Game" + " positive-gradient";
	    	} else {
	    		return d.Team1.replace(/ /g, "") + "Game" + " negative-gradient"; 
	    	}
	    })
	    .attr("x", function(d) { return xScale(d.order); })	    
	    .attr("width", function(d) { return xScale.bandwidth(); })
	    .attr("height", function(d) { return 0; })
	    .attr("stroke", "white")
	    .attr("stroke-width", 0)
        .attr("transform", function(d) {
        	if (d.MOV > 0) {
	        	return "translate(" + margin.left + "," + (height + margin.top) + ") scale(1, -1)"
	        } else {
	        	return "translate(" + margin.left + "," + margin.top + ")"
	        }
        })
        .attr("y", height/2)
        .on("mouseover", function(d) { 
        	d3.select(this).attr("stroke-width", "2");
        	return mouseover(d); 
        })
		.on("mousemove", function(d) { return mousemove(d); })
		.on("mouseout", function(d) { 
        	d3.select(this).attr("stroke-width", "0");
			return mouseout(d); 
		})

	svg.selectAll(".teamname")
	    .data(function(d) { return d.data; })
	    .enter().append("text") 
	    .attr("x", function(d) { return 0; })
	    .attr("y", function(d) { return 0; })
	    .text(function(d) { if (d.order == 1) { return d.Team1.toUpperCase(); } })
        .attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top*0.75) + ")")
        .attr("text-anchor", "middle")
        .attr("class", "teamname");



	var xAxis = d3.axisBottom(xScale).tickFormat('').tickSize(0);
    // svg.append("g")
	   //  .call(xAxis) 
	   //  .attr("transform", "translate(" + (margin.left) + "," + (margin.top + height/2) + ")")
	   //  .attr("class", "xaxis");

	var tooltip = d3.select("body").append("div")
	    .attr("class", "bar-tooltip")

// waypoints for transition

yScale.range([0, height/2])

$.each(teams, function(i, team){ 
	var team = team.replace(/ /g, "")
	var waypoint = new Waypoint({
		  element: document.getElementById(team),
		  handler: function(direction) {
		    d3.selectAll("."+ team + "Game")
		    	.transition()
		    	.delay(function(d) { return d.order * 5; })
		    	.duration(500)
		    	.ease(d3.easeQuadInOut)
		    	.attr("height", function(d) { 
		    		return yScale(Math.abs(d.MOV)); 
		    	});
		  },
		  offset: 'bottom-in-view'
	})
})

// jump to a specific team

teams = teams.sort()
$.each(teams, function(i, team){ 
	$(".selectpicker").append("<option>" + team + "</option>")	
})
$('.selectpicker').selectpicker('refresh');

$('#nbateams').on('hidden.bs.select', function (e) {
  var team = $(".selectpicker").val().replace(/ /g, "");
  $('html, body').animate({
	scrollTop: $("#"+team).offset().top
  }, 2000);
});

})