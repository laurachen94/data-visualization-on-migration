var slider = new Slider("#yearslider", {
        ticks: [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010],
        ticks_labels: ["1990", "1991", "1992", "1993", "1994", "1995", "1996", "1997", "1998", "1999", "2000", "2001", "2002", "2003", "2004","2005", "2006", "2007", "2008", "2009", "2010"],
        ticks_snap_bounds: 10
    });
var year = 1990;
slider.on('change', function(event) {
    var a = event.newValue;
    var b = event.oldValue;
    var changed = !($.inArray(a[0], b) !== -1 &&
                    $.inArray(a[1], b) !== -1 &&
                    $.inArray(b[0], a) !== -1 &&
                    $.inArray(b[1], a) !== -1 &&
                    a.length === b.length);

    if(changed) {
        year = a;
        show(year);
    }
});
    
var w = window,
d = document,
e = d.documentElement,
g = d.getElementsByTagName('body')[0],
winwidth = w.innerWidth || e.clientWidth || g.clientWidth,
winheight = w.innerHeight|| e.clientHeight|| g.clientHeight;

// initial the map size
var svg = d3.select("#map");
svg.attr("width", 0.8*winwidth)
    .attr("height", 0.8*winheight)
    .append("g");
var width = 0.8*winwidth;
var height = 0.8*winheight;
var svggroup = d3.select("#groupMap");
// innitial the project of map
var projection = d3.geoAlbersUsa().scale(40);
var pathGenerator = d3.geoPath().projection(projection);

var trans;
var paths;

// json to make map
var states;
// map year migration by state id
var ImmiMap;
// store the state longitude and latitude and name
var StateCode;
// store the state information by id
var StateId;

// innitial the colors
var sequentialColors = ["#FFFFE5","#FFFFCC","#FFF7BC","#FFEDA0","#FEE391","#FED976","#FEC44F","#FEB24C","#FE9929","#FD8D3C","#FB6A4A","#FC4E2A","#EF3B2C","#CB181D","#BD0026","#A50F15","#800026","#67000D"]
var colorinstate = ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5']
var coloroutstate = ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801']
var incolorscale = d3.scaleThreshold()
.domain([0, 250, 500, 750, 1000]).range(colorinstate);
var outcolorscale = d3.scaleThreshold()
.domain([0, 250, 500, 750, 1000]).range(coloroutstate);
var allstatecolorscale = d3.scaleQuantize().domain([0, 12707337]).range(sequentialColors);
// show by year
function show(year) {
    d3.queue()
    .defer(d3.json, "./data/us.json")
    .defer(d3.csv, "./data/table" + year + ".csv")
    .defer(d3.csv, "./data/statescolor.csv")
    .await(function (error, rawMap, rawImmi, rawState) {
        // read the data
        states = topojson.feature(rawMap, rawMap.objects.states);
        StateCode = rawState;
        StateId = d3.map(rawState, function(d) {return d.id});
        ImmiMap = d3.map(rawImmi, function(d) {return d.State});
        // find the max and min
        var popMax = 0;
        var popMin = parseInt(ImmiMap.get("1")["1"]);
        rawState.forEach(function(d, i){
            var thisPop = parseInt(ImmiMap.get(d.id)[d.id]);
            if(thisPop > popMax){
                popMax = thisPop;
            }
            if(thisPop < popMin){
                popMin = thisPop;
            }
        })
        // show the map of this year
        showMap();
        // draw the map color legend
        drawLegend();
        // show the group map
        showGroupMap();
    });
}
// show the initial map without click and hover
function showMap() {
    // show the population lineChart
    showPop("USA");
    svg.selectAll("path.states").remove();
    svg.selectAll("text").remove();
    // project the map on the svg
    projection.fitExtent([[0,0], [svg.attr("width"), svg.attr("height")]], states);
    pathGenerator = d3.geoPath().projection(projection);
    // show the map path
    paths = svg.selectAll("path.states")
                .data(states.features);
    paths.enter()
        .append("path")
        .attr("id", function(state) {return "state"+state.id})
        .attr("class", "states")
        .merge(paths)
        .attr("d", function (states) {
          return pathGenerator(states);
        })
        .style("fill", function(d){
            if(ImmiMap.get(d.id) == null){
                return 0;
            }
            return allstatecolorscale(parseInt(ImmiMap.get(d.id)[d.id]))})
        .on('click', click)
        .on('mouseout', mouseout);
    trans = svg.append("g");
    // show the state code and population
    StateCode.forEach(function (d, i){
        var coord = projection([StateId.get(d.id).long, StateId.get(d.id).lati]);
        if(coord != null){
            trans.append("text")
            .attr("x", coord[0])
            .attr("y", coord[1])
            .attr("dx", "-1em")
            .attr("font-size","1.5em")
            .text(StateId.get(d.id).Code);
            trans.append("text")
            .attr("x", coord[0]-10)
            .attr("y", coord[1]+10)
            .attr("dx", "-1.5em")
            .attr("dy", "1em")
            .attr("font-size","1.5em")
            .text(ImmiMap.get(d.id)[d.id]);
        }
    });
}
    
function showPop(selectState){
    d3.select("#lineChart").selectAll("g").remove();
    var lineChart = d3.select("#lineChart"),
        lineMargin = {top: 19, right: 0, bottom: 20, left: 0},
        lineWidth = 0.8*winwidth - lineMargin.right,
        lineHeight = 0.2*winheight - lineMargin.bottom,
        g = lineChart.append("g").attr("transform", "translate(" + 0.1*winwidth + "," + lineMargin.top + ")");
        lineChart.append("g").append("text")
        .attr("transform", "translate(" + lineWidth/2 + "," + 30 + ")")
        .text(function(d){
            if(StateId.get(selectState) != null){
                return StateId.get(selectState).name;
            }
        });
    var x = d3.scaleLinear().rangeRound([0, lineWidth]);
    var y = d3.scaleLinear().rangeRound([lineHeight, 0]);
    var line = d3.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.pop); });
    d3.csv("./data/statesPopEachYear.csv", function(error, data) {
        if (error) throw error;
        var populationEachYear = d3.map(data, function(d){return d.State;})
        var dataforChart = populationEachYear.get(selectState);
        var chartArray = [];
        for(var prop in dataforChart) {
            if(dataforChart.hasOwnProperty(prop) && prop != "State") {
                var population = new Object();
                population.year = parseInt(prop);
                population.pop = parseInt(dataforChart[prop])/1000000;
                chartArray.push(population);
            }
        }
        x.domain(d3.extent(chartArray, function(d) { return d.year; }));
        y.domain(d3.extent(chartArray, function(d) { return d.pop; }));
        var xAxis = d3.axisBottom().scale(x);
        g.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0, " + (lineHeight) + ")")
          .call(xAxis);
        var yAxis = d3.axisRight().scale(y);
        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (lineWidth) + ", 0)")
            .call(yAxis)
            .append("text")
            .attr("fill", "#000")
            .attr("y", 6)
            .attr("font", "2.0em")
            .attr("text-anchor", "end")
            .text("Million");
        g.append("path")
          .datum(chartArray)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("d", line);
    });
}

function showGroupMap(){
    svggroup.attr("width", width * 0.8)
            .attr("height", height * 0.3);
    svggroup.selectAll("path").remove();
    var projectiongroup = d3.geoAlbersUsa().scale(50);
    var groupScale = d3.scaleOrdinal(['#fbb4ae','#b3cde3','#ccebc5','#decbe4']).domain(["1","2","3","4"]);
    projectiongroup.fitExtent([[0,0], [svggroup.attr("width"), svggroup.attr("height")]], states);
    var pathGeneratorgroup = d3.geoPath().projection(projectiongroup);
    var paths = svggroup.selectAll("path.country").data(states.features);
    paths.enter()
        .append("path")
        .attr("class", "states")
        .merge(paths)
        .attr("id", function(state){if(StateId.get(state.id)!=null){return StateId.get(state.id).Code;}})
        .attr("d", function (states) {
            return pathGeneratorgroup(states);
        })
        .style("fill", function(d){
            if(StateId.get(d.id)!=null){
                return groupScale(StateId.get(d.id).group);
            }
            else{return 0;}
        });
}



//if show map from hover on one states
function click(state){
    // remove the previous state info on map
    trans.selectAll("text").remove();
    svggroup.selectAll("path").style("stroke", "#888").style("stroke-width", 1);
    // put red border for the selected state by id on the groupmap
    d3.select("#"+StateId.get(state.id).Code).style("stroke", "red").style("stroke-width", 3);
    // show the linechart
    showPop(state.id);
    // show priechart
    var stateInfo = ImmiMap.get(state.id);
    showPieChart(state.id, stateInfo);
    // show the click state population
    var position = projection([StateId.get(state.id).long, StateId.get(state.id).lati])
    trans.append("text")
        .attr("x", position[0])
        .attr("y", position[1])
        .attr("dy", ".35em")
        .attr("font-size", "2em")
        .text(ImmiMap.get(state.id)[state.id]);
    // show the moving circle and migration number
    if (StateId.get(state.id) != null){
        var coord1;
        coord1 = projection([StateId.get(state.id).long, StateId.get(state.id).lati]);
        if(state == "57"){
            coord1 = [30, 30];
        }
        if(coord1 != null){
            trans.append("text")
                .attr("x", coord1[0])
                .attr("y", coord1[1])
                .attr("dy", ".35em")
                .attr("font-size", "2em")
                .text(ImmiMap.get(state.id)[state.id]);
            Object.keys(stateInfo).forEach(function (d){
                if (StateId.get(d) != null && d != stateInfo.State){
                    var coord2;
                    coord2 = projection([StateId.get(d).long, StateId.get(d).lati]);
                    if(d == "57"){
                        coord2 = [30,30];
                    }
                    if(coord2 != null){
                        if(stateInfo[d] > 0){
                            var x = coord2[0];
                            var y = coord2[1];
                            var circle = trans.append("circle")
                                                .attr("r", function (el){
                                                return Math.sqrt(Math.abs(stateInfo[d])*0.5) * width * 0.002
                                                })
                                                .attr("cx", x)
                                                .attr("cy", y)
                                                .attr("fill", "#227A3A")
                                                .attr("opacity","0.45");
                            circle.transition()
                                .duration(2000)
                                .attr("transform", "translate("+(coord1[0]-coord2[0])+","+ (coord1[1]-coord2[1])+ ")");
                        }
                        if(stateInfo[d] < 0){
                            var x = coord1[0];
                            var y = coord1[1];
                            var circle = trans.append("circle")
                                                .attr("r", function (el){
                                                    return Math.sqrt(Math.abs(stateInfo[d])*0.5)  * width * 0.002
                                                })
                                                .attr("cx", x)
                                                .attr("cy", y)
                                                .attr("fill", "#902F90")
                                                .attr("opacity","0.45");
                            circle.transition()
                                .duration(2000)
                                .attr("transform", "translate("+(coord2[0]-coord1[0])+","+ (coord2[1]-coord1[1])+ ")");
                        }
                        trans.append("text")
                                .attr("x", coord2[0])
                                .attr("y", coord2[1])
                                .attr("dx", "-1em")
                                .attr("font-size", "1.5em")
                                .text(-stateInfo[d]);
                        trans.append("text")
                                .attr("x", coord2[0]-20)
                                .attr("y", coord2[1]-15)
                                .attr("dx", "-1.5em")
                                .attr("dy", "1em")
                                .attr("font-size", "1.5em")
                                .text(StateId.get(d).Code);
                    }
                }
            })
        }
    }
}

function mouseout() {
    svg.selectAll("circle").remove();
    trans.selectAll("text").remove();
    StateCode.forEach(function (d, i){
        var coord = projection([StateId.get(d.id).long, StateId.get(d.id).lati]);
        if(coord != null){
            trans.append("text")
            .attr("x", coord[0])
            .attr("y", coord[1])
            .attr("dx", "-1em")
            .attr("font-size","1.5em")
            .text(StateId.get(d.id).Code);
            trans.append("text")
            .attr("x", coord[0]-10)
            .attr("y", coord[1]+10)
            .attr("dx", "-1.5em")
            .attr("dy", "1em")
            .attr("font-size","1.5em")
            .text(ImmiMap.get(d.id)[d.id]);
        }
    });
}


function showPieChart(selectState, stateInfo){
    d3.select("#allResult").selectAll("svg").remove();
    d3.select("#allResult").selectAll("div").remove();
    var resultWidth = width;
    var resultHeight = 0.6*height;
    // put a new svg on the bottom of the page
    var result = d3.select("#allResult").append("svg").attr("width", resultWidth).attr("height", resultHeight);
    var tooltip = d3.select("#allResult")
                    .append("div")
                    .style("font", "bold 3em Arial")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .style("visibility", "hidden");
    d3.select("#tip").style("visibility", "hidden");
    //in piechart
    var gIn = result.append("g")
        .attr("class", "piechart left")
        .attr("transform", "translate(" + (winwidth*3/10) + "," + resultHeight/ 2 + ")");
    // in text
    result.append("g")
        .append("text")
        .attr("x", winwidth*3/10)
        .attr("y", 70)
        .attr("font-weight", "bold")
        .style("font-size","40px")
        .text("Inflow");
    // out piechart
    var gOut = result.append("g")
        .attr("class", "piechart right")
        .attr("transform", "translate(" + (winwidth*7/10) + "," + resultHeight/2+ ")");
    // out text
    result.append("g")
        .append("text")
        .attr("x", winwidth*7/10)
        .attr("y", 70)
        .attr("font-weight", "bold")
        .style("font-size","40px")
        .text("Outflow");
    // select stateName
    result.append("g")
        .append("text")
        .attr("x", 0.5*winwidth)
        .attr("y", 50)
        .attr("font-weight", "bold")
        .text(StateId.get(selectState).name)
        .style("font-size","60px");  

    var piewidth = resultWidth/2, pieheight = resultWidth/2, radius = resultWidth/8;
    var color = d3.scaleOrdinal(['#fbb4ae','#b3cde3','#ccebc5','#decbe4']).domain(["1","2","3","4"]);
    var statesInflow = [];
    var statesOutflow = [];
    var stateAllIn = 0;
    var stateAllOut = 0;
    for(var prop in stateInfo) {
       if(stateInfo.hasOwnProperty(prop) && prop != "State" && prop != selectState
          && projection([StateId.get(selectState).long, StateId.get(selectState).lati]) != null) {
           if(stateInfo[prop] > 0 && StateId.get(prop).group != null){
               var stateInflow = new Object();
               stateInflow.state = parseInt(prop);
               stateInflow.flowPop = parseInt(stateInfo[prop]);
               statesInflow.push(stateInflow);
               stateAllIn += stateInflow.flowPop;
           }
           if(stateInfo[prop] < 0 && StateId.get(prop).group != null){
               var stateOutflow = new Object();
               stateOutflow.state = parseInt(prop);
               stateOutflow.flowPop = -parseInt(stateInfo[prop]);
               statesOutflow.push(stateOutflow);
               stateAllOut += stateOutflow.flowPop;
           }
       }
   }
    statesInflow.sort(function(a, b){return b.flowPop-a.flowPop});
    statesOutflow.sort(function(a, b){return b.flowPop-a.flowPop});
   var pie = d3.pie()
       .sort(function(a, b) { return StateId.get(a.state).group.localeCompare(StateId.get(b.state).group); })
       .value(function(d) { return d.flowPop; });
   var path = d3.arc()
       .outerRadius(radius - 10)
       .innerRadius(0);
   var label = d3.arc()
       .outerRadius(radius + 30)
       .innerRadius(radius + 30);
    statesInflow.forEach(function(d){
       d.flowPop = +d.flowPop;
   })
   statesOutflow.forEach(function(d){
       d.flowPop = +d.flowPop;
   })

   var arcIn = gIn.selectAll(".arc")
   .data(pie(statesInflow))
   .enter().append("g")
   .attr("class", "arc");

   var arcOut = gOut.selectAll(".arc")
   .data(pie(statesOutflow))
   .enter().append("g")
     .attr("class", "arc");


   arcIn.append("path")
     .attr("d", path)
     .attr("fill", function(d) { return color(StateId.get(d.data.state).group); })
     .attr("stroke", "white")
     .attr("stroke-width", 1)
     .on("mouseover", function(d){
           d3.select("#"+StateId.get(d.data.state).Code).style("stroke", "#227A3A").style("stroke-width", 3);
           d3.select(this).attr("stroke", "#707070").attr("stroke-width", 3);
           return tooltip.style("visibility", "visible");
      })
     .on("mousemove", function(d){
        d3.select("#"+StateId.get(d.data.state).Code).style("stroke", "#227A3A").style("stroke-width", 3);
        d3.select(this).attr("stroke", "#707070").attr("stroke-width", 3);
        if(StateId.get(d.data.state)!=null){
//                console.log(d.data.flowPop/stateAllIn);
            return tooltip.style("top", (event.pageY-10)+"px")
                .style("left",(event.pageX+10)+"px")
                .text("In " + year +", " + (parseFloat(d.data.flowPop/stateAllIn) * 100).toFixed(2) + "% immigration from " + StateId.get(d.data.state).name);
        }
   })
     .on("mouseout", function(d){
       d3.select("#"+StateId.get(d.data.state).Code).style("stroke", "#888").style("stroke-width", 1);
       d3.select(this).attr("stroke", "white").attr("stroke-width", 1);
       return tooltip.style("visibility", "hidden");
      });

   arcOut.append("path")
     .attr("d", path)
     .attr("fill", function(d) { return color(StateId.get(d.data.state).group); })
     .attr("stroke", "white")
     .attr("stroke-width", 1)
     .on("mouseover", function(d){
            d3.select("#"+StateId.get(d.data.state).Code).style("stroke", "#902F90").style("stroke-width", 3);
            d3.select(this).attr("stroke", "#707070").attr("stroke-width", 3);
            return tooltip.style("visibility", "visible");
    })
     .on("mousemove", function(d){
        d3.select("#"+StateId.get(d.data.state).Code).style("stroke", "#902F90").style("stroke-width", 3);
        d3.select(this).attr("stroke", "#707070").attr("stroke-width", 3);
        if(StateId.get(d.data.state)!=null){
//                console.log(d.data.flowPop/stateAllOut);
            return tooltip.style("top", (event.pageY-10)+"px")
                .style("left",(event.pageX+10)+"px")
                .text("In " + year +", " + (parseFloat(d.data.flowPop/stateAllOut) * 100).toFixed(2) + "% emigration from " + StateId.get(d.data.state).name);
        }
   })
     .on("mouseout", function(d){
           d3.select("#"+StateId.get(d.data.state).Code).style("stroke", "#888").style("stroke-width", 1);
           d3.select(this).attr("stroke", "white").attr("stroke-width", 1);
           return tooltip.style("visibility", "hidden");
    });

}

function drawLegend(){
    var legendMap = svg.append("g");
    legendMap.append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(30, " + (height - 20) + ")");

    var legendLinear = d3.legendColor()
    .shapeWidth(width/20)
    .cells(10)
    .orient('horizontal')
    .scale(allstatecolorscale);

    svg.select(".legendLinear")
    .call(legendLinear);

    legendMap.append("text")
    .text("<0.72 million")
    .attr("x", 30)
    .attr("y", (height - 23))
    .attr("font-weight", "bold");

    legendMap.append("text")
    .text("13 million")
    .attr("x", 925)
    .attr("y", (height - 23))
    .attr("font-weight", "bold");

    legendMap.append("text")
    .text("Color Legend - Population at beginning of "+ year)
    .attr("x", 1/2*width-100)
    .attr("y", (height -30))
    .attr("font-weight", "bold");
}
show(year);

