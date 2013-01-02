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
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

            d3.json('http://dev.torsten-muller.com/ads/lutsen.php', this.processData.bind(this));
        },

        processData: function (data) {

            var series, adId, e, sDate, item,
                minDate, maxDate,
                self = this;


            for (var adId in data) {
                series = [];
                minDate = 9999999999999999999;
                maxDate = 0;
                for (var e in data[adId]) {

                    sDate = new Date(data[adId][e].mpls_date);
                    if (sDate.getTime() < minDate) minDate = sDate.getTime();
                    if (sDate.getTime() > maxDate) maxDate = sDate.getTime();

                    item = {
                        'date': sDate,
                        'impressions': parseInt(data[adId][e].imp, 10),
                        'clicks': parseInt(data[adId][e].clk, 10)
                    };
                    series.push(item);
                }

                chartData[adId] = series;
                availableSeries.push({id: adId, name: data[adId][0].description, minDate: minDate, maxDate: maxDate});
            }

            d3.select('#data-sets')
                .selectAll('li')
                .data(availableSeries)
                .enter()
                .append('li')
                .text(function (d) {
                    return d.name
                })
                .attr('data-id', function(d) {return d.id})
                .on('click', function () {
                    var newSeries = d3.select(this).attr('data-id');
                    var i, l = availableSeries.length;
                    for (i=0; i < l; i++) {
                        if (availableSeries[i].id == newSeries) {
                            self.updateChart(availableSeries[i]);
                            break;
                        }
                    }
                });

            this.initPlot();
            this.drawSeries(availableSeries[0]);

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


        drawSeries: function(seriesHead) {


            var self = this;

            // update the headline of the chart so we know for which
            // data sets we are plotting
            d3.select('.headline')
                .text(seriesHead.name);

            // Create the axes for the chart and also determine
            // the scales for the axes.
            var xScale = this.scaleX(seriesHead);
            var yScale = this.impressionScale(seriesHead.id);

            this.drawAxes(xScale, yScale);


            // Draw the line first so that hovers over circles get registered!
            var line = d3.svg.line()
                .x(function(d) {return xScale(new Date(d.date).getTime())})
                .y(height - graphMargin);

            svg.append('path')
                .attr('d', line(chartData[seriesHead.id]))
                .attr('class', 'data-path');

            line.y(function(d) {return yScale(d.impressions)});

            svg.select('path.data-path')
                .transition()
                .duration(750)
                .attr('d', line(chartData[seriesHead.id]));


            // Select all the available data points on the graph and
            // associate them with the data set.
            var dataPoints = svg
                .selectAll('.data-point')
                .data(chartData[seriesHead.id], function(d) {return d.impressions});

            // For any new data points, create a circle on the graph
            dataPoints.enter()
                .append('circle')
                .attr('class', 'data-point')
                .attr('cx', function(d) {return xScale(new Date(d.date).getTime());})
                .attr('cy', height - graphMargin)
                .attr('r', 4)
                .attr('data-num', function(d) { return JSON.stringify(d); })
                .on('mouseover', function() {

                    d3.select(this).transition().attr('r', 7);
                    var data = JSON.parse(d3.select(this).attr('data-num'));

                    document.getElementById('date').textContent = self.formatDate(data.date);
                    document.getElementById('impressions').textContent = data.impressions;
                    document.getElementById('clicks').textContent = data.clicks;
                    document.getElementById('clickthrough').textContent = Math.round(data.clicks / data.impressions * 10000) / 100 + '%';

                    document.getElementById('tooltip').style.display = 'block';
                })
                .on('mouseout', function() {
                    d3.select(this).transition().attr('r', 4);
                })
                .transition()
                .duration(750)
                .attr('cy', function(d) {return yScale(d.impressions)});

            // Any data points that have new values: move them
            // to their new location
            dataPoints
                .transition()
                .duration(750)
                .attr('cy', function(d) {return yScale(d.impressions)})
                ;


            dataPoints.exit()
                .transition()
                .duration(750)
                .attr('opacity', 0)
                .attr('y', height - graphMargin)
                .remove();





        },



        formatDate: function(date) {

            var fDate = '';
//            var d = new Date(date);
            var d = new Date(new Date(date).getTime() + 6*3600000);

            fDate += monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
            return fDate;
        },



        drawAxes: function(x, y) {

            // Draw the axes
            var xAxis = d3.svg.axis().scale(x);
            var yAxis = d3.svg.axis().scale(y).orient('left');

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
                .text('Impressions/ day')
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
            });
        },



        scaleX: function(headData) {

            var scale = d3.time
                          .scale()
                          .domain([headData.minDate, headData.maxDate])
                          .range([graphMargin, width - graphMargin]);

            return scale;
        },



        impressionScale: function(dataId) {

            var domain = [0, d3.max(chartData[dataId], function(d) {return d.impressions})];
            var scale = d3.scale.linear()
                                  .range([height - graphMargin, graphMargin])
                                  .domain(domain);

            return scale;
        },


        setAxis: function(dataSet) {

            var xRange = d3.extent([0,1,2,3,4,5,6,7,8,9,10]);
            var xScale = d3.scale.linear().range([graphMargin, width - graphMargin]).domain(xRange);

            var yRange = [1, d3.max(dataSet, function(d) {return d.y})]
            var yScale = d3.scale.linear().range([height - graphMargin, graphMargin]).domain(yRng);

            return {x: xScale, y: yScale};
        }

    }
}();


Number.prototype.zeroPad = function(digits) {
    var a = '00000000' + this;
    return a.substr(a.length - digits, digits);
};
