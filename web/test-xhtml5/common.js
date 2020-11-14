// common.js
/*global: window, document */

(function () {
    "use strict";

    // Must be writable: true, enumerable: false, configurable: true
    if (typeof Object.assign !== 'function') Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // .length of function is 2
            if (target == null) { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var result = Object(target), i, nextObj, nextKey, hasOwn = Object.prototype.hasOwnProperty;

            for (i = 1; i < arguments.length; i++) {
                nextObj = arguments[i];
                // Skip undefined or null.
                if (nextObj == null) continue;
                for (nextKey in nextObj) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (hasOwn.call(nextObj, nextKey)) {
                        result[nextKey] = nextObj[nextKey];
                    }
                }
            }
            return result;
        },
        writable: true,
        configurable: true
    });

    if (!window.akme) window.akme = {};

    var akme = window.akme,
        slice = Array.prototype.slice,
        xhrWhenMap = {
            "whenTimeout": -1,
            "whenConnect": 1,
            "whenHeaders": 2,
            "whenDone": 4
        };

    akme.arrayFrom = function (obj) { return slice.call(obj); };
    akme.xhrWhen = {};
    akme.dom = {};

    /**
     * Prepare XMLHttpRequest helper methods, e.g.
     * This is meant for MSIE 11+ HTML5 compatibility.
     * https://msdn.microsoft.com/en-us/library/ms535874(v=vs.85).aspx
     * https://www.w3.org/TR/2014/WD-XMLHttpRequest-20140130/#xmlhttprequesteventtarget
     * @example
     * xhrWhen.open("GET", "https://www.google.com/")
     *  .whenConnect(function (xhr) { console.info(xhr.readyState, xhr.status, "Connect"); })
     *  .whenHeaders(function (xhr) { console.info(xhr.ok, xhr.status, xhr.getAllResponseHeaders()); })
     *  .whenDone(function (xhr) { console.info(xhr.ok, xhr.status, xhr.responseText); })
     *  .send();
     */
    function xhrOn(readyState, callback) {
        var self = this;
        // If already in the readyState, use a timeout to ensure async callback.
        // Handle -1 as special timeout state.
        if (readyState !== -1 && self.readyState >= readyState) {
            setTimeout(function () { callback(self); }, 0);
            return self;
        }
        // If not in readyState, wait for it and only callback once.
        function onState() {
            if (readyState === -1 || self.readyState >= readyState) {
                self.removeEventListener(readyState === -1 ? "timeout" : "readystatechange", onState);
                callback(self);
            }
        }
        self.addEventListener(readyState === -1 ? "timeout" : "readystatechange", onState, false);
        return self;
    }

    Object.assign(akme.xhrWhen, {
        open: function () {
            var xhr = new XMLHttpRequest();
            xhr.open.apply(xhr, arguments);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setProperty = function (key, val) { this[key] = val; return this; };
            Object.keys(xhrWhenMap).forEach(function (key) {
                var val = xhrWhenMap[key];
                xhr[key] = function (callback) { return xhrOn.call(this, val, callback); };
            });
            ["send", "setRequestHeader"].forEach(function (key) {
                var oldFcn = xhr[key];
                xhr[key] = function () { oldFcn.apply(this, arguments); return this; };
            });
            // Support setting multiple headers from a map.
            xhr.setRequestHeaders = function (map) {
                Object.keys(map).forEach(function (key) { xhr.setRequestHeader(key, map[key]); });
                return xhr;
            };
            // Support the JS fetch() Response.ok (status 200-299) read-only property.
            Object.defineProperty(xhr, "ok", {
                get: function () { return this.status && this.status >= 200 && this.status < 300; }
            });
            return xhr;
        },
        parseHeaders: function (text) {
            var headers = {}, lines = String(text).split("\n");
            lines.forEach(function (line) {
                var colon = line.indexOf(": ");
                if (colon !== -1) {
                    headers[line.substring(0, colon)] = line.substring(colon + 2).replace(/\r$/, "");
                }
            });
            return headers;
        }
    });

    Object.assign(akme.dom, {
        /**
         * Shortcut to document.getElementById(id).
         * If given (doc, id), uses the given document instead of the default.
         */
        byId: function(id) {
            var doc = document;
            if (typeof id === "object") {
                doc = id;
                id = arguments[1];
            }
            return doc.getElementById(id);
        },

        /**
         * Shortcut to Array.from(elem.getElementsByClassName(name)).
         */
        byClassAll: function(elem, name) {
            var result = elem.getElementsByClassName(name);
            return result ? akme.arrayFrom(result) : [];
        },

        /**
         * Shortcut to Array.from(elem.querySelector(str)).
         */
        query: function(elem, str) {
            return elem.querySelector(str);
        },

        /**
         * Shortcut to Array.from(elem.querySelector(str)).
         */
        queryAll: function(elem, str) {
            var result = elem.querySelectorAll(str);
            return result ? akme.arrayFrom(result) : [];
        },

        /**
         * How to handle for IE11?
         * Need to pass in the name of the script and search the DOM for it.
         */
        getCurrentScript: function (name) {
            return document.currentScript || document.querySelector("script[src*='" + name + "']");
        },

        /**
         * Get any _xdoc property of the currentScript.
         * The name is only needed as a fallback for IE11.
         */
        getCurrentTemplateDoc: function (name) {
            var script = this.getCurrentScript(name);
            return script ? script._xdoc : null;
        },

        /**
         * Create an Element by name and optionally assign attributes by HTML name (not JS property name).
         * @example
         * document.head.appendChild(createElement("link",
         *     {rel: "preload", href: "other.js", as: "script"}
         * ));
         */
        createElement: function (name, attributes) {
            var elem = document.createElement(name);
            if (attributes) this.setAttributes(elem, attributes);
            return elem;
        },

        /**
         * Set attributes on the given Element from the given map.
         * @example
         * document.head.appendChild(setAttributes(document.createElement("link"),
         *     {rel: "preload", href: "other.js", as: "script"}
         * ));
         */
        setAttributes: function (elem, map) {  // map is required
            Object.keys(map).forEach(function (key) {
                elem.setAttribute(key, map[key]);
            });
            return elem;
        },

       /**
         * Deep clone a node that is a template.
         * Set the style display to empty and the id as specified, or empty if not provided.
         */
        cloneTemplateNode: function(node, id) {
            var clone = node.cloneNode(true);
            clone.id = id ? id : '';
            clone.style.display = '';
            return clone;
        },
        /**
         * Import and deep clone a node from another document which could be from XHR responseXML.
         */
        importNode: function(doc, thatChild) {
            var result, firstChild,
                nodeName = thatChild.nodeName.toLowerCase();
            // Need to set innerHTML event after appendChild to convert simple XML to more useful XHTML.
            // Safari does not like /* CDATA */ in a script.cloneNode(true).
            // Chrome/Safari/WebKit does not like to importNode for a style.
            result = doc.createElement(nodeName==="link" || nodeName==="style" || nodeName==="script" ? "head" : "div");
            result.appendChild(doc.importNode(thatChild, true));
            firstChild = result.firstChild;
            result.removeChild(firstChild);
            return firstChild;
        },
        importElementsReplaceById: function (doc, thatParent, scriptElem, callback) {
            var result, handler;
            if (!scriptElem) {
                result = this.importElementsReplaceByIdInternal(doc, thatParent);
                if (callback) callback();
                return result;
            }
            scriptElem._xdoc = thatParent;
            handler = function (ev) {
                if (ev.type === "load") {
                    this.importElementsReplaceByIdInternal(doc, thatParent);
                }
                if (callback) callback(ev);
            }.bind(this);
            ["load", "error", "timeout"].forEach(function (type) {
                scriptElem.addEventListener(type, handler);
            });
        },
        /**
         * Import and replace Elements into the given doc from thatParent.
         * Return an array of elements that were replaced.
         */
        importElementsReplaceByIdInternal: function(doc, thatParent) {
            var titleNode = thatParent.querySelector("head>title");
            // Title is special.
            if (titleNode && titleNode.textContent) {
                document.title = titleNode.textContent;
            }
            var a = [], parentAry = [thatParent], parent, childNodes, i, child, thisChild, importChild;
            for (parent = parentAry.pop(); parent != null; parent = parentAry.pop()) {
                childNodes = parent.childNodes;
                for (i = 0; i < childNodes.length; i++) {
                    child = childNodes[i];
                    if (child.nodeType == 1) { // 1=ElementNode
                        thisChild = child.getAttribute("id") > "" ? doc.getElementById(child.getAttribute("id")) : null;
                        if (thisChild) {
                            importChild = this.importNode(doc, child);
                            thisChild.parentNode.replaceChild(importChild, thisChild);
                            a[a.length] = importChild;
                        } else {
                            parentAry[parentAry.length] = child;
                        }
                    }
                }
            }
            return a;
        },
        /**
         * Import and append a child node to the given parent.
         * Return the imported child node.
         */
        importNodeAppendChild: function(thisParent, thatChild) {
            var doc;
            if (thisParent.ownerDocument) {
                doc = thisParent.ownerDocument;
            } else {
                doc = thisParent;
                // An XHTML doc doesn't have all the HTML DOM methods.
                thisParent = doc.getElementsByTagName("body")[0];
            }
            var result = this.importNode(doc, thatChild);
            thisParent.appendChild(result);
            return result;
        },

        /**
         * Fetch the given xhtml template and case xlink=css,js any of those related.
         */
        fetchTemplate: function (path) {
            var head = document.head,
                pathHash = path.split("#", 2),
                linkMatch = /(?:^|&)xlink=([\w,.+-]*)/.exec(pathHash[1]),
                stylePath = linkMatch && /css/.test(linkMatch[1]) ?
                    path.split(/\.x?html/, 2)[0] + ".css" :
                    null,
                scriptPath = linkMatch && /js/.test(linkMatch[1]) ?
                    path.split(/\.x?html/, 2)[0] + ".js" :
                    null,
                elem,
                xhrWhen;

            // TODO: handle unloading by xhtml ref, need to have map of current ones.
            // Load any CSS early to avoid visual glitches.
            // Remove and reload style and script, assuming it should be in cache.
            if (stylePath) {
                elem = this.query(head, 'link[href="' + stylePath + '"');
                if (elem != null) head.removeChild(elem);
                head.appendChild(this.createElement("link", {
                    rel: "stylesheet",
                    type: "text/css",
                    href: stylePath
                }));
            }
            // Preload JS only once so it's ready right after the xhtml loads.
            if (scriptPath && !this.query(head, 'link[href="' + scriptPath + '"')) {
                head.appendChild(this.createElement("link", {
                    rel: "preload",
                    as: "script",
                    href: scriptPath
                }));
            }
            // Fetch the .xhtml template using XHR for optimal responseXML parsing,
            // or the .html template parsed with DOMParser() from responseText,
            // and run the related script if given.
            // Most browsers support responseType = "document" to parse even non-xml text/html into responseXML.
            // Use DOMParser on responseText for browsers that don't support the above.
            // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseXML
            // https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
            xhrWhen = akme.xhrWhen.open("GET", path);
            xhrWhen.responseType = "document";
            xhrWhen.whenDone(function (xhr) {
                //console.info(xhr);
                // If working with an overall Promise, it would be for the xhtml and if given the script.
                var script, xdoc;
                if (scriptPath) {
                    script = this.query(head, 'script[src="' + scriptPath + '"');
                    if (script) head.removeChild(script);
                    script = this.createElement("script", {
                        src: scriptPath,
                        async: true
                    });
                }
                if (script) head.appendChild(script);
                xdoc = xhr.responseXML || new DOMParser(xhr.responseText, "text/html");
                this.importElementsReplaceById(document, xdoc, script);
            }.bind(this)).send();
        }
    });

}());
