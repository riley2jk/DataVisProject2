class TimeBar {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1200,
            containerHeight: _config.containerHeight || 250,
            tooltipPadding: _config.tooltipPadding || 15,
            margin: { top: 40, right: 50, bottom: 20, left: 50 },
        };

        this.data = _data;

        console.log("Attempt timeBar");

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width =
            vis.config.containerWidth -
            vis.config.margin.left -
            vis.config.margin.right;
        vis.height =
            vis.config.containerHeight -
            vis.config.margin.top -
            vis.config.margin.bottom;

        // Initialize scales and axes

        // Initialize scales
        vis.colorScale = d3.scaleOrdinal().range(["#339ab3"]); // TBD Color

        // Important: we flip array elements in the y output range to position the rectangles correctly
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        vis.xScale = d3.scaleBand().range([0, vis.width]).paddingInner(0.2);

        vis.xAxis = d3.axisBottom(vis.xScale).tickValues([]).tickSizeOuter(0);

        vis.yAxis = d3.axisLeft(vis.yScale).tickSizeOuter(0);

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        // SVG Group containing the actual chart; D3 margin convention
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

    updateVis() {
        let vis = this;

        console.log("rollup time");

        // Prepare data: count number of stars for each exoplanet
        const aggregatedDataMap = d3.rollups(
            vis.data,
            (v) => v.length,
            (d) => d.REQUESTED_DATETIME // .replace('-','').replace('-','')
        );

        console.log(aggregatedDataMap);

        function dateToNum(d) {
            d = d[0].split("-");
            return Number(d[0] + d[1] + d[2]);
        }

        aggregatedDataMap.sort(function (a, b) {
            return dateToNum(a) - dateToNum(b);
        });

        vis.aggregatedData = Array.from(aggregatedDataMap, ([key, count]) => ({
            key,
            count,
        }));

        console.log(vis.aggregatedData.key);

        console.log(vis.aggregatedData);

        // Specificy accessor functions
        vis.colorValue = (d) => d.key;
        vis.xValue = (d) => d.key;
        vis.yValue = (d) => d.count;

        // Set the scale input domains
        vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
        vis.yScale.domain([0, d3.max(vis.aggregatedData, vis.yValue)]);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

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
            const dateObj = new Date(date + "T00:00:00");
            return (
                days[dateObj.getDay()] +
                ", " +
                months[dateObj.getMonth()] +
                " " +
                dateObj.getDay() +
                ", " +
                dateObj.getFullYear()
            );
            //return new Intl.DateTimeFormat("en-US").format(dateObj);
        }

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
            .attr("fill", (d) => vis.colorScale(vis.colorValue(d)));

        // Tooltip event listeners
        bars.on("mouseover", (event, d) => {
            d3.select("#tooltip-bar")
                .style("opacity", 1)
                // Format number with million and thousand separator
                .html(
                    `<div class="tooltip-title">${formDate(d.key)}</div>
                    <div>${d.count} calls</div>`
                );
        })
            .on("mousemove", (event) => {
                d3.select("#tooltip-bar")
                    .style(
                        "left",
                        event.pageX + vis.config.tooltipPadding + "px"
                    )
                    .style(
                        "top",
                        event.pageY + vis.config.tooltipPadding + "px"
                    );
            })
            .on("mouseleave", () => {
                d3.select("#tooltip-bar").style("opacity", 0);
            });

        // Update axes
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }
}
