-- test.lua

require "apache2"
-- local http = require "socket.http"
local mime = require "mime"
-- local socket = require "socket"
local curl = require "luacurl"
local timeout = 15

local CRLF = "\r\n"
local CR = "\r"


-- Handle request.
function handle(r)
	-- r.headers_in["X-Requested-With"] == "XMLHttpRequest"
	headers(r)
	head(r)
	body(r)
	tail(r)
	return apache2.OK
end


function sendHeader(conn,line)
	conn:send(line..CRLF)
end


function recvHeader(conn)
	return conn:receive('*l')
end


function headers(r)
	r.err_headers_out["Expires"] = 0
	r.err_headers_out["Cache-Control"] = "private, max-age=0"
end


function head(r)
	r:write([[<!DOCTYPE html >
<html><head>
<title>lua test</title>
<style>
#log { white-space: pre; }
</style>
]]);
	r:write([[
</head><body>
hello!
]]);
end


function body(r)
	r:write( "<br/>" .. socket._VERSION )
	r:write( "<br/>" .. mime.b64("fulano:silva") )
	
	--local work = socket.protect(function()
		socket.TIMEOUT = timeout
		socket.http.TIMEOUT = timeout
		local conn, er = socket.try( socket.connect( "localhost", 80 ) )
		local data = {}
		if conn ~= nil then
		
			function close(er) if er ~= nil then r:write(er) end; conn:close() end
			local try = socket.newtry(close)
			conn:settimeout(timeout)
			sendHeader(conn, "HEAD http://localhost/ HTTP/1.1")
			sendHeader(conn, "Host: localhost")
			sendHeader(conn, "Connection: close")
			sendHeader(conn, "")
			while true do
				local str, er, prt = try( conn:receive() )
				-- status 'closed', 'timeout'
				if (str or prt) == '' or status == 'closed' or status == 'timeout' 
				then break
				else table.insert(data, str or prt)
				end
			end
			-- data, er = try( conn:receive() )
		
			close()
		
		end
		
		r:write( "<br/>er ".. tostring(er) .."<br/>data " .. table.concat(data,"<br/>"..CRLF) )
	--end)
	
	--[[
		http.request seems to crash.  Found at least one error in http.lua source: 
			line = sock:receive()
		should be
			line, err = sock:receive()
	]]
	--r:write( http.request("http://localhost/") );
	--[[
	local a, b, c = http.request{
		method = "HEAD",
		url = "http://localhost/"
	}
	]]
	-- luacurl has intermittent problems
	--[[
	local conn, code, data = curl.new(), 0, nil
	conn:setopt(curl.OPT_URL, "http://localhost/")
	conn:setopt(curl.OPT_NOBODY, true)
	conn:setopt(curl.OPT_DNS_CACHE_TIMEOUT, 5*60)
	conn:setopt(curl.OPT_CONNECTTIMEOUT, 15)
	conn:setopt(curl.OPT_TIMEOUT, 15)
	conn:setopt(curl.OPT_NOSIGNAL, true)
	if conn:perform() then 
		code = conn:getinfo(curl.INFO_RESPONSE_CODE) 
	end
	conn:close()
	r:write( "<br/>status: " .. code )
	]]
end


function tail(r)
	r:write([[
</body></html>]]);
end
