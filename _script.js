// colors for teams

d3.json("teamcolors.json", function(teamcolors) {

// console.log(teamcolors);
teamcolors = _.filter(teamcolors, function(obj) { return obj.league == 'nba'})
// console.log(teamcolors);

// our input dataset, cleaned slightly

d3.csv("all_mov.csv", function(dataset) {

  // var gsw = _.filter(dataset, function(obj) { return obj["Team1"] == "Golden State Warriors"})

  // // // 

  // SVG attributes
  var margin = {left: 50, right: 50, top: 60, bottom: 20}; 
  var totalWidth = (d3.select("#chart").node().getBoundingClientRect().width);
  var height = (d3.select("#chart").node().getBoundingClientRect().width)/3;
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

	var toRGB = function(rgbstring) {
		return "rgba("+rgbstring.replace(" ", ",").replace(" ", ",")+", 1)"
	}

	// Actually create SVGs for each team

  // PLayoffs
  svg.selectAll(".playoffs")
    .data(function(d) { return d.data; })
    .enter().append("rect") 
    .attr("x", function(d) { return xScale(82) + margin.left; })
    .attr("y", function(d) { return height/2 + margin.top; })
    .attr("width", function(d) { return xScale(num_games - 82); })
    .attr("class", d => "playoffs"+d.Team1.replace(/ /g, ""))
    .attr("height", function(d) { return 0; })
    .attr("fill", "white")
    .attr("display", function(d) { if (d.order != 1) { return "none"; } })
    .attr("stroke-dasharray", 0 + " " + (xScale(num_games - 82) + height) + " " + xScale(num_games - 82) + " " + 0)
    // .attr("stroke-dasharray", xScale(num_games - 82) + " " + (2*height + xScale(num_games - 82)))
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 1)
    .attr("stroke", "white")
    .attr("fill-opacity", 0.2);

  svg.selectAll(".playoff-text")
      .data(function(d) { return d.data; })
      .enter().append("text") 
      .attr("x", function(d) { return 0; })
      .attr("y", function(d) { return 0; })
      .text(function(d) { if (d.order == 1) { return "playoffs"; } })
      .attr("display", function(d) { if (d.order != 1) { return "none"; } })
      .attr("transform", "translate(" + (margin.left + xScale(82)) + "," + (margin.top + height + 16) + ")")
      .attr("text-anchor", "left")
      .attr("class", d => "playoff-text playoff-text"+d.Team1.replace(/ /g, ""));

	svg.selectAll(".team")
	    .data(function(d) { 
	    	return d.data; 
	    })
	    .enter().append("rect") 
	    .attr("class", function(d) {
	    	if (d.MOV > 0) {
	    		return d.Team1.replace(/ /g, "") + "Game" + " 1positive-gradient";
	    	} else {
	    		return d.Team1.replace(/ /g, "") + "Game" + " 1negative-gradient"; 
	    	}
	    })
	    .attr("x", function(d) { return xScale(d.order); })	    
	    .attr("width", function(d) { return xScale.bandwidth(); })
	    .attr("height", function(d) { return 0; })
	    .attr("stroke", "white")
	    .attr("fill", function(d) {
	    	// console.log(d.Team1)
	    	// console.log(_.find(teamcolors, function(obj) { return obj.name == d.Team1})["colors"])
	    	// console.log(toRGB(_.find(teamcolors, function(obj) { return obj.name == d.Team1})["colors"]["rgb"][0]))
	    	if (d.MOV > 0) {
	        	return toRGB(_.find(teamcolors, function(obj) { return obj.name == d.Team1})["colors"]["rgb"][0])
	        } else {
	        	return "black";
	        	// return toRGB(_.find(teamcolors, function(obj) { return obj.name == d.Team1})["colors"]["rgb"][1])
	        }
	    })
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
      .attr("display", function(d) { if (d.order != 1) { return "none"; } })
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

// Annotation

const type = d3.annotationCalloutCircle

// console.log(dataset);
// console.log(xScale("80"))
const annotations = [{
  note: { label: "Start of the Toaster Era"},
  x: xScale(73) - xScale.bandwidth()/2, y: height/2 + margin.top,
  dy: height/3, dx: -margin.left/2,
  subject: { radius: 2 * xScale.bandwidth(), radiusPadding: 0 }
}]

const makeAnnotations = d3.annotation()
  .editMode(false)
  .type(type)
  //accessors & accessorsInverse not needed
  //if using x, y in annotations JSON
  // .accessors({
  //   x: d => x(parseTime(d.date)),
  //   y: d => y(d.close)
  // })
  // .accessorsInverse({
  //    date: d => timeFormat(x.invert(d.x)),
  //    close: d => y.invert(d.y)
  // })
  .annotations(annotations)

d3.select("svg")
  .append("g")
  .attr("class", "annotation-group")
  .call(makeAnnotations)

document.documentElement.style.setProperty('--annotation-color', '#ecf0f1');


d3.selectAll(".annotation-group")
  .transition().delay(1500)
  .style("visibility", function() { return "visible"; });


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
        d3.selectAll(".playoffs"+team)
          .transition().duration(500).delay(82*5)
          .ease(d3.easeQuadInOut)
          .attr("height", function() { 
            return height; 
          })
          .attr("y", function() { 
            return margin.top; 
          });
        d3.selectAll(".playoff-text"+team)
          .transition().delay(500 + 82*5).duration(500)
          .style("visibility", function() { return "visible"; });
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

});

});

// // Let's use d3.annotations

// const type = d3.annotationCalloutCircle

// const annotations = [{
//   note: {
//     label: "Toaster Era Begins",
//     // title: "Annotations :)"
//   },
//   //can use x, y directly instead of data
//   data: { order: 100, MOV: 20 },
//   dy: 50,
//   dx: 0,
//   subject: {
//     radius: 50,
//     radiusPadding: 5
//   }
// }]

// const makeAnnotations = d3.annotation()
//   .editMode(true)
//   .type(type)
//   //accessors & accessorsInverse not needed
//   //if using x, y in annotations JSON
//   // .accessors({
//   //   x: d => xScale(d.order),
//   //   y: d => yScale(d.MOV)
//   // })
//   // .accessorsInverse({
//   //    order: d => xScale.invert(d.x),
//   //    MOV: d => yScale.invert(d.y)
//   // })
//   .annotations(annotations)

// d3.selectAll("#GoldenStateWarriors").selectAll("svg")
//   .append("g")
//   .attr("class", "annotation-group")
//   .call(makeAnnotations)