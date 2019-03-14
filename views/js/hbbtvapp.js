// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// hbbtv app                                                                               //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

/*global oipfObjectFactory */

window.InitHBBTVApp = function (log) {

    var appMan      = null;
    var _app        = null;
    var _cfg        = null;
    
    
    try {
        if (oipfObjectFactory.isObjectSupported("application/oipfApplicationManager")) {
            appMan = oipfObjectFactory.createApplicationManagerObject();
        }
    } catch (err) {
        log.warn("Exception when creating creating ApplicationManager Object. Error: " + err.message);
    }
    
    try {
        _app = appMan.getOwnerApplication(document);
    } catch (err) {
        log.warn("Exception when getting the owner Application object. Error: " + err.message);
    }

    if (_app) {
        try {
            _app.show();
        } catch (err) {
            log.warn("Exception when calling show() on the owner Application object. Error: " + err.message);
        }

        try {
            var myKeyset = _app.privateData.keyset;
            myKeyset.setValue(  myKeyset.RED        | 
                                myKeyset.GREEN      | 
                                myKeyset.BLUE       | 
                                myKeyset.YELLOW     | 
                                0x20        |
                                myKeyset.NUMERIC    |
                                myKeyset.NAVIGATION);
        } catch (err) {
            log.warn("Exception accessing app.privateData.keyset. Error: " + err.message);
        }
    }

    try {
        if (oipfObjectFactory.isObjectSupported("application/oipfConfiguration")) {
            _cfg = oipfObjectFactory.createConfigurationObject();
            if (_cfg.configuration) {
                log.info("oipfConfiguration: " + JSON.stringify(_cfg.configuration));
            } else {
                log.warn("oipfConfiguration null");
            }
        }
    } catch (err) {
        log.warn("Exception when creating creating oipfConfiguration Object. Error: " + err.message);
    }
    
    return {
        app : _app,
        cfg : _cfg
    };
};
