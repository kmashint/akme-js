-- console log/viewer.lua

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


function head(r)
	r:write([[<!DOCTYPE html >
<html><head>
<title>console-log viewer</title>
<style>
#log { white-space: pre; }
</style>
	]])
	r:write([[
</head><body>]]);
end


function body(r)
	r:write("<h3>Web Browser console-log Viewer</h3>\n")
	r:write( os.date("!%a, %d %b %Y %H:%M:%S GMT") )
	r:write( " (".. os.date("%H:%M:%S %Z") ..")" )
	r:write([[
<form name='console'>
Date: <select name='date'>
]])
	for k,v in ipairs(findDates(r)) do
		r:write("<option ".. (v==r.notes["date"] and "selected=''" or "") ..">".. 
			r:escape_html(v) .."</option>")
	end
	r:write([[</select>
Time (starts-with): <input type='text' name='time' size='8' maxlength='10' value=']].. r:escape_html(r.notes["time"]) ..[[' />
User (matches): <input type='text' name='user' maxlength='32' value=']].. r:escape_html(r.notes["user"]) ..[[' />
Replay: <input type='checkbox' name='replay' value='1' />
<input type='button' name='findBtn' value='Search' onclick='findLines(this)' />
</form>
<hr/>
<div id='log'>
</div>
<script src='viewer.js'></script>
]]);
end


function tail(r)
	r:write([[</body></html>]]);
end


function findDates(r)
	local result = {}
	for _,f in ipairs(r:get_direntries("logs")) do
		if string.find(f,"^console\.") then
			table.insert(result,1,string.sub(f,9,18)) 
		end
	end
	return result
end


function findLines(r)
	local time, user = r.notes["time"], r.notes["user"]
	if time and string.len(time) < 2 then time = nil end
	if user and string.len(user) == 0 then user = nil end
	-- "text/plain; charset=ISO-8859-1" -- "application/json; charset=UTF-8"
	r.content_type = "text/plain; charset=ISO-8859-1"
	local fname = "logs/console.".. r.notes["date"] ..".log"
	local fstat = r:stat(fname)
	if not fstat then
		r.status = 404
		return
	end
	local maxAge = 15 -- seconds
	r.headers_out["Cache-Control"] = "private, max-age=".. maxAge
	--r:puts("[")
	local first = true
	if fstat and time then 
		local timeRE = '^.."'..time
		local userRE = user and '^[^,]*,[^,]*,'..(user ~= "null" and '"'..user..'"' or user) or nil 
		for line in io.lines(fname) do if string.find(line, timeRE) and
				(not userRE or (userRE and string.find(line, userRE))) then
			--if first then first = false; else r:puts(","); end
			r:puts(line,"\n")
		end end
	end
	--r:puts("]")
end
