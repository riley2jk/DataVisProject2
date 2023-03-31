console.log("Hello World");

d3.tsv("data/cincyData.txt").then((data) => {
    // Initialize scales
    const colorScale = d3.scaleOrdinal().range(["#4682b4"]); // steel blue

    console.log(data);
    console.log(data.length);
    data.forEach((d) => {
        d.latitude = +d.LATITUDE; //make sure these are not strings
        d.longitude = +d.LONGITUDE; //make sure these are not strings
    });

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#my-map" }, data);
    leafletMap.updateVis();

    // Initialize and render bar chart
    dayofweekbarchart = new DayOfWeekBarchart(
        {
            parentElement: "#dayofweekbarchart",
            colorScale: colorScale,
        },
        data
    );
    dayofweekbarchart.updateVis();

    // Initialize and render bar chart
    servicetypebarchart = new ServiceTypeBarchart(
        {
            parentElement: "#servicetypebarchart",
        },
        data
    );
    servicetypebarchart.updateVis();

    // Initialize and render bar chart
    updatedtimebarchart = new UpdatedTimeBarchart(
        {
            parentElement: "#updatedtimebarchart",
        },
        data
    );
    updatedtimebarchart.updateVis();

    // Initialize and render bar chart
    zipcodebarchart = new ZipcodeBarchart(
        {
            parentElement: "#zipcodebarchart",
        },
        data
    );
    zipcodebarchart.updateVis();

    timebar = new TimeBar({ parentElement: "#timebar" }, data);
    timebar.updateVis();
});
// .catch((error) => console.error(error));

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

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

function formDate(date) {
    return (
        days[date.getDay()] +
        ", " +
        months[date.getMonth()] +
        " " +
        date.getDate() +
        ", " +
        date.getFullYear()
    );
    //return new Intl.DateTimeFormat("en-US").format(dateObj);
}
