/*global google */
/*eslint no-console: "off"*/

const remote = require("electron").remote;
const MAXROWS = 600;

var graph = {};

graph.charts = {};
graph.viewMin = 0;

function e(id) {
    return document.getElementById(id);
} 

window.onload = function () {
    var li;
    
    graph.start();

    function onClickMenu(id) {
        return function () {
            var window = remote.getCurrentWindow();
            window.close();
        };
    }
    
    li = document.getElementsByClassName("titleitem");
    for (var i = 0;  i < li.length; i++) {
        li[i].onclick = onClickMenu(li[i].id);
    }
};

graph.start = function () {
    this.setupCharts();
};

graph.setupCharts = function () {
    var that = this;

    google.charts.load("current", {"packages":["corechart", "line"]});
    google.charts.setOnLoadCallback(drawCharts);

    function drawChart(id, title, div) {

        that.charts[id] = {};
        
        that.charts[id].chartData = new google.visualization.DataTable();
        
        that.charts[id].chartData.addColumn("number", "Time"); 
        that.charts[id].chartData.addColumn("number", "Duration"); 
        that.charts[id].chartData.addColumn("number", "Pos"); 
        that.charts[id].chartData.addColumn("number", "Buffer"); 
        that.charts[id].chartData.addColumn("number", "Headroom"); 

        that.charts[id].chartData.addColumn({type:"string", role:"annotation"}); 
        that.charts[id].chartData.addColumn({type:"string", role:"annotationText"});

        that.charts[id].chartOptions = {
            title: title,
            curveType: "none",
            legend: { position: "bottom" },
            hAxis: { 
                viewWindow: { min: "0" }
            }
        };

        that.charts[id].chart = new google.visualization.LineChart(e(div));
        // that.charts[id].chart.draw(that.charts[id].chartData, that.charts[id].chartOptions);
    }

    function drawCharts() {
        
        if (e("chart_div0")) {  drawChart("main", "Main / Live Video", "chart_div0");   }
        if (e("chart_div1")) {  drawChart("mVid-video0", "Video Object 0", "chart_div1");           }
        if (e("chart_div2")) {  drawChart("mVid-video1", "Video Object 1", "chart_div2");           }
        
    }   
};

graph.updateChart = function (chartObj, d, t, pos, buffer, hroom, annotation) {
    var ev;
    var chData = chartObj.chartData;
    
    if (annotation) {
        ev = "e";
    } else {
        ev = null;
        annotation = null;
    }
            
    if (chData) {
        chData.addRow([ parseFloat(t),  
            parseFloat(d), 
            parseFloat(pos), 
            parseFloat(buffer), 
            parseFloat(hroom),
            ev,
            annotation
        ]);     
                                
        if (chData.getNumberOfRows() > MAXROWS) {
            chData.removeRow(0);            
        }
        
        var m = chData.getValue(0, 0);
        
        if (m > graph.viewMin) {
            graph.viewMin = m;
        }
        chartObj.chartOptions.hAxis.viewWindow.min = graph.viewMin;

        chartObj.chart.draw(chData, chartObj.chartOptions);
        //console.log(annotation);
    }
};

// listen for the ipc events
const ipc = require("electron").ipcRenderer; // Picks up messages sent through electrons internal IPC functions
 
ipc.on("ipc-buffer", function(event, message) {
    try {
        var msgObj = JSON.parse(message.toString("utf8")); 
        var pbObj = msgObj.playerBufferObj;
        var hbObj = msgObj.headroomBufferObj;
        var playerId = pbObj.id;
        
        if ((playerId == "mVid-mainContent") || (playerId == "mVid-broadcast")) {
            playerId = "main";
        }
        
        //console.log(pbObj);
        if (graph.charts[playerId]) {
            graph.updateChart(graph.charts[playerId], pbObj.duration, pbObj.time, pbObj.currentTime, pbObj.value, hbObj.value, pbObj.annotation);
        }
    } catch(err) {
        console.log("ipc-buffer: message parse error. " + err.message);
        return;
    }
    
});
