-- MSIETest.lua
require "apache2"

function handle(r)
	r.headers_out["Access-Control-Allow-Origin"] = "http://localhost"
	r.headers_out["Content-Type"] = "text/plain; status=200"
	r:write("OK")
	return apache2.OK
end
