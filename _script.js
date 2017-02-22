// colors for teams

d3.json("teamcolors.json", function(teamcolors) {

console.log(teamcolors);

// our input dataset, cleaned slightly

d3.csv("all_mov.csv", function(dataset) {

  // var gsw = _.filter(dataset, function(obj) { return obj["Team1"] == "Golden State Warriors"})

  // // // 

  // SVG attributes
  var totalWidth = d3.select("#chart").node().getBoundingClientRect().width;
  var height = 200;
  var margin = {left: 50, right: 50, top: 60, bottom: 20}; 
  var width = totalWidth - margin.left - margin.right;


  // Build our nested dataset to be used to construct small multiples

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

  // Sort by winning percentage
  grouped = _.sortBy(grouped, function(obj) { 
  	return (_.filter(obj.data, function(game) { return game.MOV > 0; })).length / obj.data.length;
  }).reverse()

  // Create our main SVG

  var svg = d3.select("#chart").selectAll("svg")
        .data(grouped)
        .enter()
        .append("div")
        .attr("class", function(d) { return "team" })
       	.attr("id", function(d) { return d.teamname.replace(/ /g, ""); })
        .append("svg:svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    // Create scale

    var num_games = _.max(_.map(grouped, function(obj) { return obj.data.length; }));
    var largest_mov = _.max(_.map(dataset, function(obj) { return parseInt(obj["MOV"]); }));
    // http://stackoverflow.com/questions/3746725/create-a-javascript-array-containing-1-n
    var xScale = d3.scaleBand().range([0, width]).paddingInner(0.2)
    			   .domain(Array.apply(null, {length: num_games}).map(Number.call, Number))
    var yScale = d3.scaleLinear().domain([0, largest_mov]).range([0, height/2])

    // Functions for handling mouse events

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

	// Create and render axes

	var yAxis = d3.axisLeft(yScale.range([height/2, 0])).ticks(3)
    svg.append("g")
	    .call(yAxis) 
	    .attr("transform", "translate(" + (margin.left - 5) + "," + margin.top + ")")
	    .attr("class", "axis yaxis");

	var negativeFormat = function(d) { if(d != 0) { return "-" + d; } };
    var yAxis = d3.axisLeft(yScale.range([0, height/2])).ticks(3).tickFormat(negativeFormat)
    svg.append("g")
	    .call(yAxis) 
	    .attr("transform", "translate(" + (margin.left - 5) + "," + (height/2 + margin.top) + ")")
	    .attr("class", "axis yaxis");



	 // Reset Scale from Axis
	yScale.range([0, height/2])

	// Actually create SVGs for each team

	svg.selectAll(".team")
	    .data(function(d) { 
	    	return d.data; 
	    })
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

	// Label with the team name
	svg.selectAll(".teamname")
	    .data(function(d) { return d.data; })
	    .enter().append("text") 
	    .attr("x", function(d) { return 0; })
	    .attr("y", function(d) { return 0; })
	    .text(function(d) { if (d.order == 1) { return d.Team1.toUpperCase(); } })
        .attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top*0.75) + ")")
        .attr("text-anchor", "middle")
        .attr("class", "teamname");

    // X-Axis, if needed
	var xAxis = d3.axisBottom(xScale).tickFormat('').tickSize(0);
    // svg.append("g")
	   //  .call(xAxis) 
	   //  .attr("transform", "translate(" + (margin.left) + "," + (margin.top + height/2) + ")")
	   //  .attr("class", "xaxis");

	// Construct tooltip for mouse events
	var tooltip = d3.select("body").append("div")
		.style("display", "none")
	    .attr("class", "bar-tooltip")

// Waypoints for transition

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
$('.selectpicker').selectpicker('val', grouped[0].teamname);
$('.selectpicker').selectpicker('refresh');

$('#nbateams').on('hidden.bs.select', function (e) {
  var team = $(".selectpicker").val().replace(/ /g, "");
  $('html, body').animate({
	scrollTop: $("#"+team).offset().top - 100
  }, 2000);

  d3.selectAll("#"+team).selectAll("svg")
  	.append("rect")
  	.attr("x", 0)
  	.attr("y", 0)
  	.attr("width", width + margin.left + margin.right)
  	.attr("height", height + margin.top + margin.bottom)
  	// .attr("rx", 5)
  	// .attr("ry", 5)
  	.attr("stroke", "white")
  	.attr("stroke-width", "0")
  	.attr("fill", "none")
  	.transition().duration(1500)
  	.attr("stroke-width", "7")
  	.transition().duration(1500)
  	.attr("stroke-width", "0");

});

})

})