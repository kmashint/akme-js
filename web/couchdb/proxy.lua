-- couchdb/proxy.lua

require "apache2"
require "io"

-- HTTP Date: Sun, 20 Apr 2014 15:25:27 GMT
-- os.date("*t") gives a table/map with {year,month,day,hour,min,sec,wday,yday,isdst}.
-- os.date("!%a, %d %b %Y %H:%M:%S GMT") gives the HTTP Date format, the ! forcing UTC/GMT.
-- os.date("%Y-%m-%d") gives the Calendar Year(####) Month(01-12) Day(01-31).
-- os.date("%G-%V-%u") gives the ISO-8601 Year(####) Week(01-53) Weekday(1-7) by ISO Monday.


-- Handle request.
function handle(r)
	-- r.headers_in["X-Requested-With"] == "XMLHttpRequest"
	local args = r:parseargs()
	r.notes["date"] = args["date"] or ""
	r.notes["time"] = args["time"] or "12"
	r.notes["user"] = args["user"] or ""

	headers(r)
	if args["findBtn"] then
		findLines(r)
		return apache2.OK
	else
		head(r)
		body(r)
		tail(r)
		return apache2.OK
	end
end


function headers(r)
	r.headers_out["Expires"] = 0
	r.headers_out["Cache-Control"] = "private, max-age=0"
end

