// page1.js

(function () {
    "use strict";

    var dom = akme.dom,
        xdoc = dom.getCurrentTemplateDoc("page1.js");

    //console.log("loaded:", xdoc);
    if (xdoc) {
        var elem = dom.byId(xdoc, "templateBody");
        elem.appendChild(document.createTextNode(
            " on " + new Date().toISOString().replace("T", " at ") +
            " says Hello from a script!"));
    }

}());
