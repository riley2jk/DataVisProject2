class LeafletMap {
    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            tooltipPadding: _config.tooltipPadding || 15,
        };
        this.data = _data;
        this.initVis();
    }

    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
        let vis = this;
        vis.legend = d3.select("#legend").append("svg").attr("width", 400).attr("height", 400)
        vis.config.colorScaleString = "Default";

        //ESRI
        vis.esriUrl =
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        vis.esriAttr =
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";

        //TOPO
        vis.topoUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
        vis.topoAttr =
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';

        //Stamen Terrain
        vis.stUrl =
            "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}";
        vis.stAttr =
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

        //this is the base map layer, where we are showing the map background
        vis.base_layer = L.tileLayer(vis.stUrl, {
            id: "esri-image",
            attribution: vis.stAttr,
            ext: "png",
        });

        vis.theMap = L.map("my-map", {
            center: [39.1531, -84.5021],
            zoom: 11,
            layers: [vis.base_layer],
        });

        //if you stopped here, you would just have a map

        //initialize svg for d3 to add to map
        L.svg({ clickable: true }).addTo(vis.theMap); // we have to make the svg layer clickable
        vis.overlay = d3.select(vis.theMap.getPanes().overlayPane);
        vis.svg = vis.overlay.select("svg").attr("pointer-events", "auto");

        //these are the city locations, displayed as a set of dots
        vis.Dots = vis.svg
            .selectAll("circle")
            .data(vis.data)
            .join("circle")
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            //Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
            //leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
            //Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
            .attr(
                "cx",
                (d) =>
                    vis.theMap.latLngToLayerPoint([
                        d.latitude || 0,
                        d.longitude || 0,
                    ]).x
            )
            .attr(
                "cy",
                (d) =>
                    vis.theMap.latLngToLayerPoint([
                        d.latitude || 0,
                        d.longitude || 0,
                    ]).y
            )
            .attr("r", 3)
            .on("mouseover", function (event, d) {
                //function to add mouseover event
                d3.select(this)
                    .transition() //D3 selects the object we have moused over in order to perform operations on it
                    .duration("150") //how long we are transitioning between the two states (works like keyframes)
                    .attr("fill", "red") //change the fill
                    .attr("r", 4); //change radius

                d3.select("#tooltip")
                    .style("opacity", 1)
                    .style("z-index", 10000000)
                    .html(
                        `<div class="tooltip-title">Service: ${d.SERVICE_NAME}</div>
                        <div><i>${d.STATUS}</i></div>
                        <ul>
                          <li>${d.AGENCY_RESPONSIBLE}</li>
                          <li>${d.REQUESTED_DATE}</li>
                          <li>Last updated: ${d.UPDATED_DATE}</li>
                          <li>Description: ${d.DESCRIPTION}</li>
                        </ul>`
                    );
            })
            .on("mousemove", (event) => {
                d3.select("#tooltip")
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + 10 + "px");
            })
            .on("mouseleave", function () {
                //function to add mouseover event
                d3.select(this)
                    .transition() //D3 selects the object we have moused over in order to perform operations on it
                    .duration("150") //how long we are transitioning between the two states (works like keyframes)
                    .attr("r", 3); //change radius

                d3.select("#tooltip").style("opacity", 0);
            })
            .on("click", (event, d) => {
                //experimental feature I was trying- click on point and then fly to it
                // vis.newZoom = vis.theMap.getZoom()+2;
                // if( vis.newZoom > 18)
                //  vis.newZoom = 18;
                // vis.theMap.flyTo([d.latitude, d.longitude], vis.newZoom);
            });

        //handler here for updating the map, as you zoom in and out
        vis.theMap.on("zoomend", function () {
            vis.updateVis();
        });
    }

    updateVis() {
        let vis = this;

        //want to see how zoomed in you are?
        // console.log(vis.map.getZoom()); //how zoomed am I

        //want to control the size of the radius to be a certain number of meters?
        vis.radiusSize = 3;

        // if( vis.theMap.getZoom > 15 ){
        //   metresPerPixel = 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * Math.PI/180)) / Math.pow(2, map.getZoom()+8);
        //   desiredMetersForPoint = 100; //or the uncertainty measure... =)
        //   radiusSize = desiredMetersForPoint / metresPerPixel;
        // }

        //redraw based on new zoom- need to recalculate on-screen position
        vis.Dots
            .attr(
                "cx",
                (d) => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).x
            )
            .attr(
                "cy",
                (d) =>
                    vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).y
            )
            .attr("r", vis.radiusSize);
        
        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        vis.colorBy = d3.scaleOrdinal()
            .range("steelblue")

        if (vis.config.colorScaleString == "byService"){
            vis.colorBy = d3.scaleOrdinal()
            .domain(["Metal Furniture, Spec Collectn", "Trash, request for collection", "Yard waste,rtc", "Building, residential", 
            "Default, police (and junk veh)", "Litter, private property", "Slippery streets, request", "Pothole, repair", 
            "Trash cart, registration"])
            .range(["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22"])

            vis.Dots
                .attr("fill", d => vis.colorBy(d.SERVICE_NAME))

            // PLEASE DONT COMMENT ON HOW UGLY THIS LOOKS THANK YOU
            vis.legend.selectAll('*').remove(); // remove legend elements before adding new one
            vis.legend.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 5).attr('stroke', 'black').attr('fill', '#1f77b4')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 30).attr('r', 5).attr('stroke', 'black').attr('fill', '#ff7f0e')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 50).attr('r', 5).attr('stroke', 'black').attr('fill', '#2ca02c')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 70).attr('r', 5).attr('stroke', 'black').attr('fill', '#d62728')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 90).attr('r', 5).attr('stroke', 'black').attr('fill', '#9467bd')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 110).attr('r', 5).attr('stroke', 'black').attr('fill', '#8c564b')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 130).attr('r', 5).attr('stroke', 'black').attr('fill', '#e377c2')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 150).attr('r', 5).attr('stroke', 'black').attr('fill', '#7f7f7f')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 170).attr('r', 5).attr('stroke', 'black').attr('fill', '#bcbd22')
            vis.legend.append("text").attr("x", 20).attr("y", 10).text("Metal Furniture, Spec Collectn").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 30).text("Trash, request for collection").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 50).text("Yard waste,rtc").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 70).text("Building, residential").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 90).text("Default, police (and junk veh)").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 110).text("Litter, private property").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 130).text("Slippery streets, request").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 150).text("Pothole, repair").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 170).text("Trash cart, registration").style("font-size", "15px").attr("alignment-baseline","middle")
        }
        else if (vis.config.colorScaleString == "byAgency"){
            vis.colorBy = d3.scaleOrdinal()
            .domain(["Public Services", "Cinc Building Dept", "Cinc Health Dept", "Dept of Trans and Eng", 
            "City Manager's Office", "Police Department", "Park Department", "Cin Water Works"])
            .range(["#d53e4f","#f46d43","#fdae61","#fee08b","#e6f598","#abdda4","#66c2a5","#3288bd"])

            vis.Dots
                .attr("fill", d => vis.colorBy(d.AGENCY_RESPONSIBLE))


            vis.legend.selectAll('*').remove();
            vis.legend.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 5).attr('stroke', 'black').attr('fill', '#d53e4f')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 30).attr('r', 5).attr('stroke', 'black').attr('fill', '#f46d43')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 50).attr('r', 5).attr('stroke', 'black').attr('fill', '#fdae61')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 70).attr('r', 5).attr('stroke', 'black').attr('fill', '#fee08b')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 90).attr('r', 5).attr('stroke', 'black').attr('fill', '#e6f598')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 110).attr('r', 5).attr('stroke', 'black').attr('fill', '#abdda4')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 130).attr('r', 5).attr('stroke', 'black').attr('fill', '#66c2a5')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 150).attr('r', 5).attr('stroke', 'black').attr('fill', '#3288bd')
            vis.legend.append("text").attr("x", 20).attr("y", 10).text("Public Services").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 30).text("Cinc Building Dept").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 50).text("Cinc Health Dept").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 70).text("Dept of Trans and Eng").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 90).text("City Manager's Office").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 110).text("Police Department").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 130).text("Park Department").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 150).text("Cin Water Works").style("font-size", "15px").attr("alignment-baseline","middle")
        }
        else if (vis.config.colorScaleString == "byDate"){
            let updatedBetween = []
            for (let i=0;i<vis.data.length;i++){
                let daysBetween = vis.data[i].UPDATED_DATE.split('/')[1] - vis.data[i].REQUESTED_DATE.split('/')[1];
                switch (daysBetween){
                    case 0:
                    case 1:
                        daysBetween = "0-1"
                        break;
                    case 2:
                    case 3:
                        daysBetween = "2-3"
                        break;
                    case 4:
                    case 5:
                        daysBetween = "4-5"
                        break;
                    default:
                        daysBetween = "6+"
                        break;

                }
                updatedBetween.push(daysBetween)
            }
            vis.colorBy = d3.scaleOrdinal()
                .domain(["0-1", "2-3", "4-5", "6+"])
                .range(["#1a9641","#a6d96a","#fdae61","#d7191c"])
            
            vis.Dots
                .data(updatedBetween)
                .attr("fill", function(d){return vis.colorBy(d)})

            vis.Dots
                .data(vis.data)

            vis.legend.selectAll('*').remove();
            vis.legend.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 5).attr('stroke', 'black').attr('fill', '#1a9641')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 30).attr('r', 5).attr('stroke', 'black').attr('fill', '#a6d96a')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 50).attr('r', 5).attr('stroke', 'black').attr('fill', '#fdae61')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 70).attr('r', 5).attr('stroke', 'black').attr('fill', '#d7191c')
            vis.legend.append("text").attr("x", 20).attr("y", 10).text("0-1 Days").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 30).text("2-3 Days").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 50).text("4-5 Days").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 70).text("6+ Days").style("font-size", "15px").attr("alignment-baseline","middle")
        }
        else if (vis.config.colorScaleString == "byMonth"){
            vis.colorBy = d3.scaleOrdinal()
                .domain(["9, 10, 11, 12"])
                .range(["#aff05b","#28ea8d","#2f96e0","#6e40aa"])

            let monthsArray = []
            for (let i=0;i<vis.data.length;i++){
                let monthReceived = vis.data[i].REQUESTED_DATE.split('/')[0]
                monthsArray.push(monthReceived)
            }

            vis.Dots
                .data(monthsArray)
                .attr("fill", function(d){return vis.colorBy(d)})

            vis.Dots
                .data(vis.data)

            vis.legend.selectAll('*').remove();
            vis.legend.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 5).attr('stroke', 'black').attr('fill', '#aff05b')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 30).attr('r', 5).attr('stroke', 'black').attr('fill', '#28ea8d')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 50).attr('r', 5).attr('stroke', 'black').attr('fill', '#2f96e0')
            vis.legend.append('circle').attr('cx', 10).attr('cy', 70).attr('r', 5).attr('stroke', 'black').attr('fill', '#6e40aa')
            vis.legend.append("text").attr("x", 20).attr("y", 10).text("September").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 30).text("October").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 50).text("November").style("font-size", "15px").attr("alignment-baseline","middle")
            vis.legend.append("text").attr("x", 20).attr("y", 70).text("December").style("font-size", "15px").attr("alignment-baseline","middle")
        }
        else if (vis.config.colorScaleString == "Default"){
            vis.Dots
                .attr("fill", "steelblue")

            // remove legend if default
            vis.legend.selectAll('*').remove();
        }

        vis.Dots
            .on("mouseleave", function () {
                //function to add mouseover event
                if (vis.config.colorScaleString == "byService"){
                    d3.select(this)
                        .transition()
                        .attr("fill", d => vis.colorBy(d.SERVICE_NAME))
                }
                else if (vis.config.colorScaleString == "byAgency"){
                    d3.select(this)
                        .transition()
                        .attr("fill", d => vis.colorBy(d.AGENCY_RESPONSIBLE))
                }
                else if (vis.config.colorScaleString == "byDate"){
                    let updatedBetween = []
                    for (let i=0;i<vis.data.length;i++){
                        let daysBetween = vis.data[i].UPDATED_DATE.split('/')[1] - vis.data[i].REQUESTED_DATE.split('/')[1];
                        switch (daysBetween){
                            case 0:
                            case 1:
                                daysBetween = "0-1"
                                break;
                            case 2:
                            case 3:
                                daysBetween = "2-3"
                                break;
                            case 4:
                            case 5:
                                daysBetween = "4-5"
                                break;
                            default:
                                daysBetween = "6+"
                                break;

                        }
                        updatedBetween.push(daysBetween)
                    }
                    vis.colorBy = d3.scaleOrdinal()
                        .domain(["0-1", "2-3", "4-5", "6+"])
                        .range(["#1a9641","#a6d96a","#fdae61","#d7191c"])
                    
                    vis.Dots
                        .data(updatedBetween)
                        .attr("fill", function(d){return vis.colorBy(d)})

                    vis.Dots
                        .data(vis.data)

                }
                else if (vis.config.colorScaleString == "byMonth"){
                    let monthsArray = []
                    for (let i=0;i<vis.data.length;i++){
                        let monthReceived = vis.data[i].REQUESTED_DATE.split('/')[0]
                        monthsArray.push(monthReceived)
                    }

                    vis.Dots
                        .data(monthsArray)
                        .attr("fill", function(d){return vis.colorBy(d)})

                    vis.Dots
                        .data(vis.data)
                }
                else if (vis.config.colorScaleString == "Default"){
                    vis.Dots
                        .transition()
                        .attr("fill", "steelblue")
                }

        })

        console.log(vis.config.colorScaleString)

    }
}
