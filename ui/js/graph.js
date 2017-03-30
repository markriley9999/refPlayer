var graph = {};

graph.charts = {};

e = function(id) {
	return document.getElementById(id);
} 

window.onload = function () {
	graph.start();
}

graph.start = function () {
	this.setupCharts();
};

graph.setupCharts = function () {
	var that = this;

	google.charts.load('current', {'packages':['corechart', 'line']});
  	google.charts.setOnLoadCallback(drawCharts);

	function drawChart(id, title, div) {

		that.charts[id] = {};
		
		that.charts[id].chartData = google.visualization.arrayToDataTable([
          ['Time'	, 'Duration'	, 'Pos'	, 'Buffer'	, 'Headroom'],
          ['0'		,  0			, 0		, 0			, 0]
        ]);

        that.charts[id].chartOptions = {
          title: title,
          curveType: 'none',
          legend: { position: 'bottom' }
        };

        that.charts[id].chart = new google.visualization.LineChart(e(div));
        that.charts[id].chart.draw(that.charts[id].chartData, that.charts[id].chartOptions);
	}

	function drawCharts() {
		
		if (e("chart_div0")) {	drawChart('mVid-mainContent', 'Main Video Object', 'chart_div0');	}
		if (e("chart_div1")) {	drawChart('mVid-video0', 'Video Object 0', 'chart_div1');			}
		if (e("chart_div2")) {	drawChart('mVid-video1', 'Video Object 1', 'chart_div2');			}
		
    }	
}

var x = 0;

graph.updateChart = function (chartObj, d, t, pos, buffer, hroom) {
	if (chartObj.chartData) {
		chartObj.chartData.addRow([t.toString(),  
								parseFloat(d), 
								parseFloat(pos), 
								parseFloat(buffer), 
								parseFloat(hroom)]);		
		chartObj.chart.draw(chartObj.chartData, chartObj.chartOptions);
	}
	x++;
}

// listen for the ipc events
const ipc = require('electron').ipcRenderer; // Picks up messages sent through electrons internal IPC functions
 
ipc.on('ipc-buffer', function(event, message) {
	try {
		var msgObj = JSON.parse(message.toString('utf8')); 
		var pbObj = msgObj.playerBufferObj;
		var hbObj = msgObj.headroomBufferObj;
		var playerId = pbObj.id;
		//console.log(msgObj);
		if (graph.charts[playerId]) {
			graph.updateChart(graph.charts[playerId], pbObj.duration, pbObj.time, pbObj.currentTime, pbObj.value, hbObj.value);
		}
	} catch(err) {
		console.log("ipc-buffer: message parse error. " + err.message);
		return;
	}
	
});
