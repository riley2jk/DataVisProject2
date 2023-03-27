console.log("Hello World");

d3.tsv("data/cincyData.txt").then((data) => {
    console.log(data[0]);
    console.log(data.length);
    data.forEach((d) => {
        d.latitude = +d.LATITUDE; //make sure these are not strings
        d.longitude = +d.LONGITUDE; //make sure these are not strings
    });

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#my-map" }, data);
});
