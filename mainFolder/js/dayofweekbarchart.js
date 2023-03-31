class DayOfWeekBarchart {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 400,
            containerHeight: 220,
            margin: { top: 25, right: 20, bottom: 65, left: 55 },
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
            .ticks([
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ]);
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(4);

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
            .attr("y", 10)
            .attr("dy", ".71em")
            .text("Calls by Day of the Week");

        vis.updateVis();
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        let dayofweek_array = [];
        let requestedDate = "";
        let sundayCount = 0;
        let mondayCount = 0;
        let tuesdayCount = 0;
        let wednesdayCount = 0;
        let thursdayCount = 0;
        let fridayCount = 0;
        let saturdayCount = 0;

        for (let i = 0; i < vis.data.length; i++) {
            requestedDate = vis.data[i].REQUESTED_DATE.split(" ")[0];
            requestedDate = new Date(`${requestedDate}`);
            switch (requestedDate.getDay()) {
                case 0:
                    dayofweek_array.push("Sunday");
                    sundayCount += 1;
                    break;
                case 1:
                    dayofweek_array.push("Monday");
                    mondayCount += 1;
                    break;
                case 2:
                    dayofweek_array.push("Tuesday");
                    tuesdayCount += 1;
                    break;
                case 3:
                    dayofweek_array.push("Wednesday");
                    wednesdayCount += 1;
                    break;
                case 4:
                    dayofweek_array.push("Thursday");
                    thursdayCount += 1;
                    break;
                case 5:
                    dayofweek_array.push("Friday");
                    fridayCount += 1;
                    break;
                case 6:
                    dayofweek_array.push("Saturday");
                    saturdayCount += 1;
                    break;
            }
        }

        vis.aggregatedData = [];
        vis.aggregatedData[0] = [];
        vis.aggregatedData[0]["key"] = "Monday";
        vis.aggregatedData[0]["count"] = mondayCount;
        vis.aggregatedData[1] = [];
        vis.aggregatedData[1]["key"] = "Tuesday";
        vis.aggregatedData[1]["count"] = tuesdayCount;
        vis.aggregatedData[2] = [];
        vis.aggregatedData[2]["key"] = "Wednesday";
        vis.aggregatedData[2]["count"] = wednesdayCount;
        vis.aggregatedData[3] = [];
        vis.aggregatedData[3]["key"] = "Thursday";
        vis.aggregatedData[3]["count"] = thursdayCount;
        vis.aggregatedData[4] = [];
        vis.aggregatedData[4]["key"] = "Friday";
        vis.aggregatedData[4]["count"] = fridayCount;
        vis.aggregatedData[5] = [];
        vis.aggregatedData[5]["key"] = "Saturday";
        vis.aggregatedData[5]["count"] = saturdayCount;
        vis.aggregatedData[6] = [];
        vis.aggregatedData[6]["key"] = "Sunday";
        vis.aggregatedData[6]["count"] = sundayCount;

        vis.xValue = (d) => d.key;
        vis.yValue = (d) => d.count;

        vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
        vis.yScale.domain([0, 7000]);

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
            .attr("class", "bar")
            .attr("x", (d) => vis.xScale(vis.xValue(d)))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", (d) => vis.height - vis.yScale(vis.yValue(d)))
            .attr("y", (d) => vis.yScale(vis.yValue(d)))
            .attr("fill", "#4682b4");

        vis.xAxisG
            .call(vis.xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

        // Update the axes
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }
}
