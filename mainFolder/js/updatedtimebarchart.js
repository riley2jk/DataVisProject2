class UpdatedTimeBarchart {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 400,
            containerHeight: 255,
            margin: { top: 25, right: 20, bottom: 20, left: 60 },
        };
        this.data = _data;
        this.initVis();
    }

    /**
     * Initialize scales/axes and append static chart elements
     */
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

        vis.xScale = d3
            .scaleBand()
            .range([0, vis.width])
            .paddingInner(0.2)
            .paddingOuter(0.2);

        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3
            .axisBottom(vis.xScale)
            .ticks(["0-1", "2-3", "4-5", "6+"]);
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(5);

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        // Append group element that will contain our actual chart
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
            .attr("class", "axis-title")
            .attr("x", 10)
            .attr("y", 0)
            .attr("dy", ".71em")
            .text("Calls by Days Before an Update");

        vis.updateVis();
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        let daysArray = [];
        let zeroToOneCount = 0;
        let twoToThreeCount = 0;
        let fourToFiveCount = 0;
        let sixPlusCount = 0;

        for (let i = 0; i < vis.data.length; i++) {
            let daysBetween =
                vis.data[i].UPDATED_DATE.split("/")[1] -
                vis.data[i].REQUESTED_DATE.split("/")[1];
            switch (daysBetween) {
                case 0:
                case 1:
                    daysArray.push("0-1");
                    zeroToOneCount += 1;
                    break;
                case 2:
                case 3:
                    daysArray.push("2-3");
                    twoToThreeCount += 1;
                    break;
                case 4:
                case 5:
                    daysArray.push("4-5");
                    fourToFiveCount += 1;
                    break;
                default:
                    daysArray.push("6+");
                    sixPlusCount += 1;
                    break;
            }
        }

        vis.aggregatedData = [];
        vis.aggregatedData[0] = [];
        vis.aggregatedData[0]["key"] = "0-1";
        vis.aggregatedData[0]["count"] = zeroToOneCount;
        vis.aggregatedData[0]["color"] = "#1a9641";
        vis.aggregatedData[1] = [];
        vis.aggregatedData[1]["key"] = "2-3";
        vis.aggregatedData[1]["count"] = twoToThreeCount;
        vis.aggregatedData[1]["color"] = "#a6d96a";
        vis.aggregatedData[2] = [];
        vis.aggregatedData[2]["key"] = "4-5";
        vis.aggregatedData[2]["count"] = fourToFiveCount;
        vis.aggregatedData[2]["color"] = "#fdae61";
        vis.aggregatedData[3] = [];
        vis.aggregatedData[3]["key"] = "6+";
        vis.aggregatedData[3]["count"] = sixPlusCount;
        vis.aggregatedData[3]["color"] = "#d7191c";

        vis.xValue = (d) => d.key;
        vis.yValue = (d) => d.count;

        vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
        vis.yScale.domain([0, 30000]);

        vis.renderVis();
    }

    /**
     * This function contains the D3 code for binding data to visual elements
     * Important: the chart is not interactive yet and renderVis() is intended
     * to be called only once; otherwise new paths would be added on top
     */
    renderVis() {
        let vis = this;

        // Add rectangles
        const bars = vis.chart
            .selectAll(".bar")
            .data(vis.aggregatedData, vis.xValue)
            .join("rect")
            .attr("class", "days-bar")
            .attr("x", (d) => vis.xScale(vis.xValue(d)))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", (d) => vis.height - vis.yScale(vis.yValue(d)))
            .attr("y", (d) => vis.yScale(vis.yValue(d)))
            .attr("fill", (d) => d.color);

        // Update the axes
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }
}
