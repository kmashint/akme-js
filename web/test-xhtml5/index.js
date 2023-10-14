// index.js

(function () {
    "use strict";

    // Enable template handling on .
    akme.dom.enableTemplates();
    
    // Could add xlink=svg support.
    // Could declare the template links in xhtml but that would delay loading.
    // Then what about unloading, removing style?
    // That should work from replacing the template placeholders.
    // This only works for non-nested templates of course but keeps it simple.

    window.addEventListener('DOMContentLoaded', function (ev) {
        console.log(ev.type);
    });

}());
