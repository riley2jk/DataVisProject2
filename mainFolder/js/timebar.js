class TimeBar {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1430,
            containerHeight: _config.containerHeight || 260,
            tooltipPadding: _config.tooltipPadding || 15,
            botHeight: 80,
            margin: { top: 40, right: 10, bottom: 10, left: 50 },
            botMargin: { top: 260, right: 50, bottom: 10, left: 50 },
        };

        this.data = _data;

        console.log("Attempt timeBar");

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Calculate inner chartTop size. Margin specifies the space around the actual chartTop.
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
        vis.colorScale = d3
            .scaleOrdinal()
            .range(["#aff05b", "#28ea8d", "#2f96e0", "#6e40aa"]); // TBD Color

        // Important: we flip array elements in the y output range to position the rectangles correctly
        vis.yScaleTop = d3.scaleLinear().range([vis.height, 0]);

        vis.yScaleBot = d3
            .scaleLinear()
            .range([vis.config.botHeight, 0])
            .nice();

        vis.xScaleTop = d3.scaleBand().range([0, vis.width]).paddingInner(0.2);

        vis.xScaleBot = d3.scaleBand().range([0, vis.width]).paddingInner(0.2);

        vis.xAxisTop = d3
            .axisBottom(vis.xScaleTop)
            .tickValues([])
            .tickSizeOuter(0);

        vis.yAxisTop = d3.axisLeft(vis.yScaleTop).tickSizeOuter(0);

        vis.xAxisBot = d3
            .axisBottom(vis.xScaleBot)
            .tickValues([])
            .tickSizeOuter(0);

        vis.yAxisBot = d3.axisLeft(vis.yScaleBot).tickSizeOuter(0);

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        // SVG Group containing the actual chartTop; D3 margin convention
        vis.chartTop = vis.svg
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.margin.left},${vis.config.margin.top})`
            );

        // Append empty x-axis group and move it to the bottom of the chartTop
        vis.xAxisTopG = vis.chartTop
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);

        // Append y-axis group
        vis.yAxisTopG = vis.chartTop.append("g").attr("class", "axis y-axis");

        // Append axis title
        vis.chartTop
            .append("text")
            .attr("class", "chartTop-title")
            .attr("x", 10)
            .attr("y", -25)
            .attr("dy", ".71em")
            .text("Number of Calls per Day");

        // Append context group with x- and y-axes
        vis.chartBot = vis.svg
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.botMargin.left},${vis.config.botMargin.top})`
            );

        // Append empty x-axis group and move it to the bottom of the chartBot
        vis.xAxisBotG = vis.chartBot
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.config.botHeight})`);

        // Append y-axis group
        vis.yAxisBotG = vis.chartBot.append("g").attr("class", "axis y-axis");

        vis.brushG = vis.chartBot.append("g").attr("class", "brush x-brush");

        // Initialize brush component
        vis.brush = d3
            .brushX()
            .extent([
                [0, 0],
                [vis.config.width, vis.config.botHeight],
            ])
            .on("brush", function ({ selection }) {
                if (selection) vis.brushed(selection);
            })
            .on("end", function ({ selection }) {
                if (!selection) vis.brushed(null);
            });
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

        for (let i = 0; i < vis.aggregatedData.length; i++) {
            console.log(vis.aggregatedData[i].key.substr(5, 2));
            switch (vis.aggregatedData[i].key.substr(5, 2)) {
                case "09":
                    vis.aggregatedData[i].color = "#aff05b";
                    break;
                case "10":
                    vis.aggregatedData[i].color = "#28ea8d";
                    break;
                case "11":
                    vis.aggregatedData[i].color = "#2f96e0";
                    break;
                case "12":
                    vis.aggregatedData[i].color = "#6e40aa";
                    break;
            }

            vis.aggregatedData[i].key = new Date(
                vis.aggregatedData[i].key + "T00:00:00"
            );
        }

        console.log(vis.aggregatedData.key);

        console.log(vis.aggregatedData);

        // Specificy accessor functions
        vis.colorValue = (d) => d.color;
        vis.xValue = (d) => d.key;
        vis.yValue = (d) => d.count;

        // Set the scale input domains
        vis.xScaleTop.domain(vis.aggregatedData.map(vis.xValue));
        vis.yScaleTop.domain([0, d3.max(vis.aggregatedData, vis.yValue)]);
        vis.xScaleBot.domain(vis.aggregatedData.map(vis.xValue));
        vis.yScaleBot.domain([0, d3.max(vis.aggregatedData, vis.yValue)]);

        console.log("Scale Domains", vis.yScaleTop, vis.yScaleBot);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // Add rectangles
        const barsTop = vis.chartTop
            .selectAll(".bar")
            .data(vis.aggregatedData, vis.xValue)
            .join("rect")
            .attr("class", "time-bar")
            .attr("x", (d) => vis.xScaleTop(vis.xValue(d)))
            .attr("width", vis.xScaleTop.bandwidth())
            .attr("height", (d) => vis.height - vis.yScaleTop(vis.yValue(d)))
            .attr("y", (d) => vis.yScaleTop(vis.yValue(d)))
            .attr("fill", (d) => d.color);

        // Tooltip event listeners
        barsTop
            .on("mouseover", (event, d) => {
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

        // Add rectangles
        // const barsBot = vis.chartBot
        //     .selectAll(".bar")
        //     .data(vis.aggregatedData, vis.xValue)
        //     .join("rect")
        //     .attr("class", "bar")
        //     .attr("x", (d) => vis.xScaleBot(vis.xValue(d)))
        //     .attr("width", vis.xScaleBot.bandwidth())
        //     .attr(
        //         "height",
        //         (d) => vis.config.botHeight - vis.yScaleBot(vis.yValue(d))
        //     )
        //     .attr("y", (d) => vis.yScaleBot(vis.yValue(d)))
        //     .attr("fill", (d) => vis.colorScale(vis.colorValue(d)));

        // Update axes
        vis.xAxisTopG.call(vis.xAxisTop);
        vis.yAxisTopG.call(vis.yAxisTop);
        // vis.xAxisBotG.call(vis.xAxisBot);
        // vis.yAxisBotG.call(vis.yAxisBot); // not needed?

        // Update the brush and define a default position
        //     const defaultBrushSelection = [
        //         vis.xScaleTop(new Date("2022-10-20")),
        //         vis.xScaleBot.range()[1],
        //     ];
        //     vis.brushG.call(vis.brush).call(vis.brush.move, defaultBrushSelection);
        // }

        // /**
        //  * React to brush events
        //  */
        // brushed(selection) {
        //     let vis = this;

        //     // Check if the brush is still active or if it has been removed
        //     if (selection) {
        //         // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
        //         const selectedDomain = selection.map(
        //             vis.xScaleBot.invert,
        //             vis.xScaleBot
        //         );

        //         // Update x-scale of the focus view accordingly
        //         vis.xScaleTop.domain(selectedDomain);
        //     } else {
        //         // Reset x-scale of the focus view (full time period)
        //         vis.xScaleTop.domain(vis.xScaleBot.domain());
        //     }

        //     // Redraw line and update x-axis labels in focus view
        //     // vis.topLinePath.attr("d", vis.line);
        //     vis.xAxisTopG.call(vis.xAxisTop);
    }
}
