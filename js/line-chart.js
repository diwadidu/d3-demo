/**
 * Visualization object for creating a line-chart based on AJAX-loaded data
 *
 */

var LineCharts = function() {



    var width = 0;


    var height = 0;



    var graphMargin = 60;


    /**
     * Holds all the available data series, with the site URL being the key
     * and the properties being a numerically indexed array, where the index
     * corresponds to the month of the year.
     *
     * @type {Object}
     */
    var chartData = {};


    /**
     * Month names, just because
     *
     * @type {Array}
     */
    var months = ['', 'Jan', 'Feb', 'Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


    /**
     * Property holding the currently used series of data
     *
     * @type {Number}
     */
    var currentSeries = '';



    var availableSeries = [];


    /**
     * Property that holds a reference to the graph
     *
     * @type {null}
     */
    var svg = null;


    return {

        self: this,


        init: function(w, h) {

            width = w;
            height = h;

            d3.json('js/top15.json', this.processData.bind(this));
        },

        processData: function(data) {

            var self = this;

            var idx = 0;
            for (var site in data) {
                var series = [];
                for (var mo in data[site]) {
                    idx = parseInt(mo.substr(4,2), 10);
                    series.push({y: parseInt(data[site][mo], 10), x: idx, xname: months[idx]});
                }

                chartData[site] = series;
                availableSeries.push(site);
            }

            console.log(chartData);


            d3.select('#data-sets')
                .selectAll('li')
                .data(availableSeries)
                .enter()
                .append('li')
                .text(function(d) {return d})
                .attr('data-url', function(d) {return d})
                .on('click', function() {
                    var newURL = d3.select(this).text();
                    self.updateChart(newURL)
                });

            this.initPlot();
            this.drawSeries('http://dnr.state.mn.us');
        },


        initPlot: function() {
            svg = d3.select('#line-graph').append('svg').attr('width', width).attr('height', height);
        },


        updateChart: function(newURL) {
            this.drawSeries(newURL);
        },


        drawSeries: function(seriesIndex) {

            var scales = this.setAxis(chartData[seriesIndex]);

            this.drawAxes(scales);

            // Draw connecting path

            var line = d3.svg.line()
                .x(function(d) {return scales.x(d.x)})
                .y(height - graphMargin);

            svg.append('path')
                .attr('d', line(chartData[seriesIndex]))
                .attr('class', 'data-path');

            line.y(function(d) {return scales.y(d.y)});

            svg.select('path.data-path')
                .transition()
                .duration(750)
                .attr('d', line(chartData[seriesIndex]));


            // now draw the points so we can get the focus on them on hover
            var dataPoints = svg
                .selectAll('.data-point')
                .data(chartData[seriesIndex]);


            dataPoints
                .transition()
                .duration(750)
                .attr('cy', function(d) {return scales.y(d.y)})
                ;

            dataPoints.enter()
                .append('circle')
                .attr('class', 'data-point')
                .attr('cx', function(d) {return scales.x(d.x);})
                .attr('cy', height - graphMargin)
                .attr('r', 4)
                .on('mouseover.tooltip', function(d,i) {

                    svg.select('.dot-number').remove();

                    d3.select(this)
                        .transition()
                        .attr('r', 10)
                        .attr('opacity', 1);

                    svg.append('text')
                        .text(d.y)
                        .attr('x', scales.x(d.x) - 13)
                        .attr('y', scales.y(d.y))
                        .attr('opacity', 0)
                        .attr('class', 'dot-number')
                        .transition()
                        .duration(500)
                        .attr('transform', 'translate(0, -13)')
                        .attr('opacity', 1)
                    ;
                })
                .on('mouseout.tooltip', function() {
                    d3.select(this)
                        .transition()
                        .attr('r', 4)
                        .attr('opacity', 1)

                    svg.select('.dot-number').transition().attr('opacity', 0).remove();
                })
                .transition()
                .duration(750)
                .attr('cy', function(d) {return scales.y(d.y)})
            ;


            dataPoints.exit()
                .transition()
                .duration(750)
                .attr('opacity', 0)
                .attr('y', height - graphMargin)
                .remove();

            d3.select('.y.axis')
                .append('text')
                .text(seriesIndex)
                .attr('x', 0)
                .attr('y', 15)
                .attr('class', 'headline');



        },


        drawAxes: function(scales) {

            // Draw the axes
            var xAxis = d3.svg.axis().scale(scales.x);
            var yAxis = d3.svg.axis().scale(scales.y).orient('left');

            svg.selectAll('g.axis').remove();
            svg.selectAll('line.grid').remove();

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + (height - graphMargin) + ')')
                .call(xAxis);

            svg.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + graphMargin + ',0)')
                .call(yAxis);



            d3.select('.y.axis')
                .append('text')
                .text('Outbound clicks / month')
                .attr('class', 'axis-label')
                .attr('transform', 'rotate(270, 6, 100)')
                .attr('x', -200)
                .attr('y', 50);


            svg.selectAll('g.y.axis > g').each(function(d,i) {

                var yOffset = parseFloat(d3.select(this).attr('transform').split(',')[1])
                svg.append('line')
                    .attr('class', 'y grid')
                    .attr('x1', graphMargin)
                    .attr('x2', width - graphMargin)
                    .attr('y1', yOffset)
                    .attr('y2', yOffset);
            })


        },

        setAxis: function(dataSet) {

            var xRange = d3.extent([0,1,2,3,4,5,6,7,8,9,10]);
            var xScale = d3.scale.linear().range([graphMargin, width - graphMargin]).domain(xRange);

            var yRange = [1, d3.max(dataSet, function(d) {return d.y})]
            var yScale = d3.scale.linear().range([height - graphMargin, graphMargin]).domain([1,2000]);

            return {x: xScale, y: yScale};
        }
    }
}();

