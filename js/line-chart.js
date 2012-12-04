/**
 * Visualization object for creating a line-chart based on AJAX-loaded data
 *
 */

var LineCharts = function () {


    /**
     *
     * @type {Number}
     */
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
    var months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /**
     * Will contain the list of labels/IDs for the available
     * data sets. Rendered as a simple unordered list
     *
     * @type {Array}
     */
    var availableSeries = [];


    /**
     * Property that holds a reference to the graph
     *
     * @type {null}
     */
    var svg = null;


    return {

        self: this,

        init: function (w, h) {

            width = w;
            height = h;

            d3.json('js/top15.json', this.processData.bind(this));
        },

        processData: function (data) {

            var series,
                self = this;

            for (var site in data) {
                series = [];
                for (var mo in data[site]) {
                    idx = parseInt(mo.substr(4, 2), 10);
                    series.push({y:parseInt(data[site][mo], 10), x:idx, xname:months[idx]});
                }

                chartData[site] = series;
                availableSeries.push(site);
            }

            d3.select('#data-sets')
                .selectAll('li')
                .data(availableSeries)
                .enter()
                .append('li')
                .text(function (d) {
                    return d
                })
                .on('click', function () {
                    var newURL = d3.select(this).text();
                    self.updateChart(newURL)
                });

            this.initPlot();
        },


        initPlot: function () {
            svg = d3.select('#line-graph')
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            svg.append('svg:text')
                .text('')
                .attr('dx', 0)
                .attr('dy', 15)
                .attr('class', 'headline');

        },


        updateChart: function(newURL) {
            this.drawSeries(newURL);
        },


        drawSeries: function(seriesIndex) {

            // update the headline of the chart so we know for which
            // data sets we are plotting
            d3.select('.headline')
                .text(seriesIndex);

            // Select all the available data points on the graph and
            // associate them with the data set.
            var dataPoints = svg
                .selectAll('.data-point')
                .data(chartData[seriesIndex]);

            // For any new data points, create a circle on the graph
            dataPoints.enter()
                .append('circle')
                .attr('class', 'data-point')
                .attr('cx', function(d) {
                    return d.x * 50;
                })
                .attr('cy', function(d) {
                    console.log(d);
                    return height - graphMargin - d.y / 10;
                })
                .attr('r', 4);
        }

    }
}();

