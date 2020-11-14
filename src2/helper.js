/*global document, window, XMLHttpRequest */
/*eslint strict: [1, "function"] */
(function (global) {
    "use strict";

    var LOAD_TIMEOUT = 30000, akme;

    // Prepare adobe_dc_sdk window global if missing.
    global.akme = global.akme || {};
    akme = global.akme;

    // Prepare XMLHttpRequest helper methods, e.g.
    // akme.xhr.open("GET", "https://www.adobe.com/")
    //  .whenHeaders(function (xhr) { console.info(xhr.status, xhr.getAllResponseHeaders()); })
    //  .whenDone(function (xhr) { console.info(xhr.status, xhr.responseText); })
    //  .send();
    // This is meant for a MSIE 10+ HTML5 compatibility:
    // https://msdn.microsoft.com/en-us/library/ms535874(v=vs.85).aspx
    // https://www.w3.org/TR/2014/WD-XMLHttpRequest-20140130/#xmlhttprequesteventtarget

    function xhrOn(readyState, callback) {
        var self = this;
        // If already in the readyState, use a timeout to ensure async callback.
        if (self.readyState >= readyState) {
            setTimeout(function () { callback(self); }, 0);
            return self;
        }
        // If not in readyState, wait for it and only callback once.
        function onState() {
            if (self.readyState >= readyState) {
                callback(self);
                self.removeEventListener(onState);
            }
        }
        self.addEventListener("readystatechange", onState, false);
        return self;
    }

    akme.xhr = {
        open: function () {
            var xhr = new XMLHttpRequest();
            xhr.open.apply(arguments);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.whenHeaders = function (callback) { return xhrOn(2, callback); };
            xhr.whenDone = function (callback) { return xhrOn(4, callback); };
            return xhr;
        }
    };

    // Prepare script.load helper method, e.g.
    //  adobe_dc_sdk.script.load("index.js", console.info, console.error);

    akme.script = {
        load: function (uri, resolve, reject) {
            var head = document.head || document.getElementsByTagName("head")[0],
                script = head.querySelector('script[src="' + uri + '"]'),
                timeoutEvent;
            // If already loaded, use a timeout to ensure async callback.
            if (script && typeof script.loaded === "boolean") {
                setTimeout(function () {
                    if (script.loaded) { resolve(script); } else { reject(script); }
                }, 0);
                return script;
            }
            // If not loaded, do so while monitoring for an error and timeout.
            script = document.createElement("script");
            script.src = uri;
            function callback(ok) {
                script.loaded = ok;
                clearTimeout(timeoutEvent);
                if (ok) { resolve(script); } else { reject(script); }
            }
            script.onload = function () { callback(true); };
            script.onerror = function () { callback(false); };
            timeoutEvent = setTimeout(function () {
                if (typeof script.loaded !== "boolean") { script.onerror(); }
            }, LOAD_TIMEOUT);
            head.appendChild(script);
            return script;
        }
    };

}(typeof window === "object" ? window : global));
