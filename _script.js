// our input dataset, cleaned slightly
d3.csv("all_mov.csv", function(dataset) {

  var gsw = _.filter(dataset, function(obj) { return obj["Team1"] == "Golden State Warriors"})

  console.log(gsw)

  // // // 

  var totalWidth = d3.select("#chart").node().getBoundingClientRect().width/2;
  var height = 200;
  var margin = {left: 50, right: 50, top: 20, bottom: 20}; 
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
        .append("svg:svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    var num_games = _.max(_.map(grouped, function(obj) { return obj.data.length; }));
    var largest_mov = _.max(_.map(dataset, function(obj) { return parseInt(obj["MOV"]); }));
    var xScale = d3.scaleBand().range([0, width]).paddingInner(0.2)
    var yScale = d3.scaleLinear().domain([0, largest_mov]).range([0, height/2])

	svg.selectAll(".team")
	    .data(function(d) { xScale.domain(_.pluck(d.data, "order")); return d.data; })
	    .enter().append("rect") 
	    .attr("fill", function(d) { return "goldenrod"; })
	    .attr("x", function(d) { return xScale(d.order); })
	    .attr("y", function(d) { 
	    	if (d.MOV > 0) {
	    		return yScale(largest_mov - Math.abs(d.MOV));
	    	} else {
	    		return height/2; 
	    	}
	    })
	    .attr("width", function(d) { return xScale.bandwidth(); })
	    .attr("height", function(d) { return yScale(Math.abs(d.MOV)); })
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.selectAll(".teamname")
	    .data(function(d) { return d.data; })
	    .enter().append("text") 
	    .attr("x", function(d) { return 0; })
	    .attr("y", function(d) { return height/2; })
	    .text(function(d) { if (d.order == 1) { return d.Team1; } })
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


})