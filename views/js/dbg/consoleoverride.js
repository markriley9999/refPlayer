var console=(function(oldCons, appName){
   
   function post(s) {
        var x = new XMLHttpRequest();
        x.open("POST", "http://192.168.137.1:8080/consolelog/?appname=" + appName, false);
        x.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
        x.send(appName + " " + s);
    }
    
    post("--- START DEBUG SESSION ---");
    
    return {
        log: function(text){
            oldCons.log(text);
            post("Log: " + text);
        },
        info: function (text) {
            oldCons.info(text);
            post("Info: " + text);
        },
        warn: function (text) {
            oldCons.warn(text);
            post("WARNING: " + text);
        },
        error: function (text) {
            oldCons.error(text);
            post("ERROR: " + text);
        }
    };
}(window.console, "APP Console:"));

window.console = console;

