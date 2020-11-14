/*eslint no-console: 0 */

var err, akme = {
    copy: function(obj, map) {
        for (var key in map) if (map.hasOwnProperty(key)) obj[key] = map[key];
        return obj;
    }
};
function MyError(message, code) {
    if (code !== undefined) this.code = code;
    this.message = code !== undefined ? message +" ("+ code +")" : message;
    var er = new Error(this.message);
    er.name = this.name;  // Improve stack trace message, at least on Chrome/NodeJS.
    if (er.stack) this.stack = er.stack;  // Not available on MSIE 10-11
}
akme.copy(MyError, {
    constructor: Error  // super constructor
}).prototype = akme.copy(Object.create(Error.prototype), {
    constructor: MyError,
    name: "MyError"
});

err = new MyError("Server Error", "500");
console.log(err.name, err.message, err.code, err.stack);
