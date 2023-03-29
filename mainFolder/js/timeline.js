class Timeline {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 250,
            margin: _config.margin || {
                top: 40,
                right: 50,
                bottom: 20,
                left: 50,
            },
        };

        this.data = _data;

        console.log("Attempt Timeline");

        this.initVis();
    }

    // Initialize scales/axes and append static chart elements
    initVis() {
        let vis = this;

        vis.width =
            vis.config.containerWidth -
            vis.config.margin.left -
            vis.config.margin.right;
        vis.height =
            vis.config.containerHeight -
            vis.config.margin.top -
            vis.config.margin.bottom;

        vis.xScale = d3.scaleTime().range([0, vis.width]);

        vis.yScale = d3.scaleLinear().range([vis.height, 0]).nice();

        // Initialize axes
        vis.xAxis = d3
            .axisBottom(vis.xScale)
            .ticks(10)
            .tickSizeOuter(0)
            .tickPadding(10)
            .tickFormat(d3.format("d"));
        //.tickFormat(d => d + ' km');

        vis.yAxis = d3
            .axisLeft(vis.yScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickPadding(10);

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        // Append group element that will contain our actual chart (see margin convention)
        vis.chart = vis.svg
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.margin.left},${vis.config.margin.top})`
            );

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

        // Append axis title
        vis.svg
            .append("text")
            .attr("class", "chart-title")
            .attr("x", 10)
            .attr("y", 10)
            .attr("dy", ".71em")
            .text("Number of Calls per Day");
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        // Prepare data: count number of stars for each exoplanet
        const aggregatedDataMap = d3.rollups(
            vis.data,
            (v) => v.length,
            (d) => d.REQUESTED_DATETIME
        );
        // const aggregatedDataMap = d3.group(vis.data, d => d.REQUESTED_DATETIME);
        vis.aggregatedData = Array.from(aggregatedDataMap, ([key, count]) => ({
            key,
            count,
        }));

        // Specificy accessor functions
        vis.colorValue = (d) => d.key;
        vis.xValue = (d) => d.key;
        vis.yValue = (d) => d.count;

        console.log("We got here");
        console.log(this.aggregatedData);

        // Initialize area generator
        vis.area = d3
            .area()
            .x((d) => vis.xScale(vis.xValue(d)))
            .y1((d) => vis.yScale(vis.yValue(d)))
            .y0(vis.height);

        vis.line = d3
            .line()
            .x((d) => vis.xScale(vis.xValue(d)))
            .y((d) => vis.yScale(vis.yValue(d)));

        // Set the scale input domains
        vis.xScale.domain(d3.extent(vis.aggregatedData, vis.xValue));
        vis.yScale.domain(d3.extent(vis.aggregatedData, vis.yValue));

        vis.renderVis();
    }

    /**
     * This function contains the D3 code for binding data to visual elements
     * Important: the chart is not interactive yet and renderVis() is intended
     * to be called only once; otherwise new paths would be added on top
     */
    renderVis() {
        let vis = this;

        // Add area path
        vis.chart
            .append("path")
            .data([vis.aggregatedData])
            .attr("class", "chart-area")
            .attr("d", vis.area);

        // Add line path
        vis.chart
            .append("path")
            .data([vis.aggregatedData])
            .attr("class", "chart-line")
            .attr("d", vis.line);

        // Update the axes
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }
}
