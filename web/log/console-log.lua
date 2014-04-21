-- Apache24/lua/console-log.lua

require "apache2"
require "io"

local ACCOUNTS = {
	["user"] = "pass"
}

-- Accept remote logs for "log", "info", "warn", "error"; "debug" not supported by MSIE.
local USER_LOG_LEVELS = {
	["user"] = "warn"
}


-- Handle the request to store browser console logs, expected as a POST of Content-Type: application/json.
function handle(r)

	-- TODO: In JS, also support cross-domain postMessage via MessageBroker.callAsync(frame, headers, content, callbackFnOrOb)
	-- TODO: authentication - use actual authentication hook to Apache logs the username
	-- TODO: client initial check to server and re-check, each page too soon, maybe 15min window, setTimeout from stored remoteLastDate?
	-- TODO: onEvent(window,"error") to queue the error without console.error logging it, http://www.eriwen.com/javascript/js-stack-trace/
	-- TODO: server and client back-off with headers_out["Retry-After"]
	local result = check_auth(r)
	if result ~= apache2.OK then
		return result;
	end
	if not (r.method == 'POST') then
		return apache2.DECLINED
	end
	local sid = nil
	local t = r:clock() -- os.time() is only to seconds
	local millis = math.floor( t % 1000000 / 1000 )
	t = math.floor( t / 1000000 )
	local f = io.open("logs/console.".. os.date("%Y-%m-%d",t) ..".log", "a")
	if f then
		local body = r.headers_in["Content-Type"] == "application/json" and r:requestbody() or nil
		f:write('[["', os.date("%H:%M:%S",t), '.', string.format("%03d",millis) ,'",', 
			(r.useragent_ip and '"'.. r.useragent_ip ..'"' or 'null') ,',', 
			(r.user and '"'.. r.user ..'"' or 'null') ,',',
			(sid and '"'.. sid ..'"' or 'null') ,',"', r.the_request ,'"],',
			body or 'null',
			']\n')
		f:close()
	end
	-- Request a specific log level for a user if configured and different.
	local logLevel = USER_LOG_LEVELS[r.user]
	if logLevel and logLevel ~= r.headers_in["X-Log-Level"] then
		r.headers_out["X-Log-Level"] = logLevel
	end
	return apache2.OK
end


-- Authentication hook using HTTP Authorization header.
function check_auth(r)
    local user, pass = parse_auth(r)
    local ok = false
    if user and pass then
        if ACCOUNTS[user] and ACCOUNTS[user] == pass then
            ok = true
            r.user = user
        end
    end
    if not ok then
		if r.headers_in["X-Requested-With"] ~= "XMLHttpRequest" then 
			r.headers_out["WWW-Authenticate"] = 'Basic realm="console-log"'
		end
        return 401
    else
        return apache2.OK
    end
end


-- Parse the Authorization header into a username and a password.
function parse_auth(r)
	local auth, user, pass = r.headers_in['Authorization'], nil, nil
	if auth and auth:len() > 0 then
		auth = r:base64_decode(auth:sub(7))
		user, pass = auth:match("([^:]+)%:([^:]+)")
    end
    return user, pass
end
