console.log("Hello World");
console.log("Hello World");

d3.tsv("data/cincyData.txt")
    .then((data) => {
        console.log(data);
        console.log(data.length);
        data.forEach((d) => {
            d.latitude = +d.LATITUDE; //make sure these are not strings
            d.longitude = +d.LONGITUDE; //make sure these are not strings
        });

        // Initialize chart and then show it
        leafletMap = new LeafletMap({ parentElement: "#my-map" }, data);
        leafletMap.updateVis();

        timeline = new Timeline({ parentElement: "#timeline" }, data);
        timeline.updateVis();
    })
    .catch((error) => console.error(error));

d3.select("#defaultbutton").on("click", (d) => {
    leafletMap.config.colorScaleString = "Default";
    leafletMap.updateVis();
});
d3.select("#agencybutton").on("click", (d) => {
    leafletMap.config.colorScaleString = "byAgency";
    leafletMap.updateVis();
});
d3.select("#servicebutton").on("click", (d) => {
    leafletMap.config.colorScaleString = "byService";
    leafletMap.updateVis();
});
d3.select("#datebutton").on("click", (d) => {
    leafletMap.config.colorScaleString = "byDate";
    leafletMap.updateVis();
});
d3.select("#monthbutton").on("click", (d) => {
    leafletMap.config.colorScaleString = "byMonth";
    leafletMap.updateVis();
});
