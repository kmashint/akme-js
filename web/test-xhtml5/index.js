// index.js

(function () {
    "use strict";

    // Could add xlink=svg support.
    // Could declare the template links in xhtml but that would delay loading.
    // Then what about unloading, removing style?
    // That should work from replacing the template placeholders.
    // This only works for non-nested templates of course but keeps it simple.
    var templateMap = {
        "page1": "page1.xhtml#xlink=css,js",
        "page2": "page2.html#xlink=css,js"
    };
    var buttons = akme.dom.queryAll(document.body, 'button[id^="page"]');

    // setTimeout(function () {
    //     akme.dom.fetchTemplate(templateMap["page1"]);
    // }, 1000);

    buttons.forEach(function (elem) {
        elem.addEventListener("click", function (ev) {
            akme.dom.fetchTemplate(templateMap[ev.target.id]);
        });
    });

}());
