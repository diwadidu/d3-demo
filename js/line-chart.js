/**
 * Visualization object for creating a line-chart based on AJAX-loaded data
 *
 */

var LineCharts = function() {


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
    var months = ['', 'Jan', 'Feb', 'Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

        init: function(w, h) {

            width = w;
            height = h;

            d3.json('js/top15.json', this.processData.bind(this));
        },

        processData: function(data) {

            var series,
                self = this;

            console.log(data);

            for (var site in data) {
                series = [];
                for (var mo in data[site]) {
                    idx = parseInt(mo.substr(4,2), 10);
                    series.push({y: parseInt(data[site][mo], 10), x: idx, xname: months[idx]});
                }

                chartData[site] = series;
                availableSeries.push(site);
            }

            d3.select('#data-sets')
                .selectAll('li')
                .data(availableSeries)
                .enter()
                .append('li')
                .text(function(d) {return d});
        }
    }
}();

