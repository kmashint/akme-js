-- console-log.lua

--package.cpath = package.cpath .. "D:/_Project/akme-js/web/log/?.dll;"
package.path = package.path .. "C:/AKME/akme-js/web/log/?.lua;"

require "apache2"
require "io"
require "authenticate-shared"

-- Accept remote logs for "log", "debug", "info", "warn", "error".
local USER_LOG_LEVELS = {
	["user"] = "warn"
}
local USER_LOG_REGEXP = {
}
--	["user"] = "."

-- Handle the request to store browser console logs, expected as a POST of Content-Type: application/json.
function handle(r)
	-- TODO: In JS, also support cross-domain postMessage via MessageBroker.callAsync(frame, headers, content, callbackFnOrOb)
	-- TODO: onEvent(window,"error") to queue the error without console.error logging it, http://www.eriwen.com/javascript/js-stack-trace/
	-- http://dev.opera.com/articles/view/better-error-handling-with-window-onerror/
	-- TODO: server and client back-off with headers_out["Retry-After"]
	authenticate(r)
	if not r.user then
		return 401
	end
	if not (r.method == 'POST') then
		return 405
	end
	local sid = nil
	local t = r:clock() -- os.time() is only to seconds
	local millis = math.floor( t % 1000000 / 1000 )
	t = math.floor( t / 1000000 )
	local f = io.open("logs/console.".. os.date("%Y-%m-%d",t) ..".log", "a")
	if f then
		local pok, presult = pcall(io.output, f)
		local body = string.find(r.headers_in["Content-Type"],"application/json")==1 and r:requestbody() or nil
		pok, presult = pcall(io.write, '[["', os.date("%H:%M:%S",t), '.', string.format("%03d",millis) ,'",', 
			(r.useragent_ip and '"'.. r.useragent_ip ..'"' or 'null') ,',', 
			(r.user and '"'.. r.user ..'"' or 'null') ,',',
			(sid and '"'.. sid ..'"' or 'null') ,',"', r.the_request ,'"],',
			body or 'null',
			']\n')
		pcall(io.close, f)
		if not pok then r:err(presult) end
	end
	-- Request a specific log level for a user if configured and different.
	local logLevel = r.user and USER_LOG_LEVELS[r.user] or nil
	if logLevel and logLevel ~= r.headers_in["X-Log-Level"] then
		r.headers_out["X-Log-Level"] = logLevel
	end
	-- Request a specific log RegExp filter for a user if configured and different.
	local logRegExp = r.user and USER_LOG_REGEXP[r.user] or nil
	if logRegExp and logRegExp ~= r.headers_in["X-Log-RegExp"] then
		r.headers_out["X-Log-RegExp"] = logRegExp
	end
	return apache2.OK
end

