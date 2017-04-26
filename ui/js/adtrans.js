var graph = {};

graph.chart = {};

e = function(id) {
	return document.getElementById(id);
} 

window.onload = function () {
	graph.start();
}

graph.start = function () {
	this.setupChart();
};

graph.setupChart = function () {
	var that = this;

	google.charts.load('current', {packages: ['corechart', 'bar']});
  	google.charts.setOnLoadCallback(drawChart);

	function drawChart() {

		that.chart = {};
		
		that.chart.chartData = google.visualization.arrayToDataTable([
          ['Video Object'	, 'Time',	{ role: 'style' }],
		  ['', 0, 'blue']
        ]);

		that.chart.chartOptions = {
			title: 'Advert Transition Times',
			chartArea: {width: '50%'},
			annotations: {
			  alwaysOutside: true,
			  textStyle: {
				fontSize: 12,
				auraColor: 'none',
				color: '#555'
			  },
			  boxStyle: {
				stroke: '#ccc',
				strokeWidth: 1,
				gradient: {
				  color1: '#f3e5f5',
				  color2: '#f3e5f5',
				  x1: '0%', y1: '0%',
				  x2: '100%', y2: '100%'
				}
			  }
			},
			hAxis: {
			  title: 'Transition Time (ms)',
			  minValue: 0,
			},
			vAxis: {
			  title: 'Video Object'
			}
		};
	  
        that.chart.chart = new google.visualization.BarChart(e("chart_div"));
        that.chart.chart.draw(that.chart.chartData, that.chart.chartOptions);
	}
}

var colTab = {};
colTab['mVid-video0'] 		= 'green';
colTab['mVid-video1'] 		= 'yellow';
colTab['mVid-mainContent'] 	= 'blue';

graph.updateChart = function (chartObj, id, time) {
	if (chartObj.chartData) {
		chartObj.chartData.addRow([id, time, colTab[id]]);		
		chartObj.chart.draw(chartObj.chartData, chartObj.chartOptions);
	}
}

// listen for the ipc events
const ipc = require('electron').ipcRenderer; // Picks up messages sent through electrons internal IPC functions
 
ipc.on('ipc-adtrans', function(event, message) {
	try {
		if (graph.chart) {
			graph.updateChart(graph.chart, message.id, parseFloat(message.time));
		}
	} catch(err) {
		console.log("ipc-adtrans: message parse error. " + err.message);
		return;
	}
	
});
