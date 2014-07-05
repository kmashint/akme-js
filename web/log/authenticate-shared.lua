--[[
 Handle authentication through a shared secret and message digest/hash.
 e.g. where the :password is the UTC_millis:MD5_hash_of_(username:millis:secret).
 username=j_keith.mashinter&j_password=1257629271921:157a7437ef7ce274754d24f0e655a225
 fw_token=keith.mashinter:1257629271921:157a7437ef7ce274754d24f0e655a225
 
 Careful with MSIE and P3P:
 http://stackoverflow.com/questions/999534/ie-p3p-iframe-and-blocked-cookies-works-until-page-host-page-has-personal-inf
]]

require "apache2"

local secret, secretPast = "foobar", nil
local cookieName = "akme_token"
local keepSecure = false
local timeoutSecs = 65*60
local refreshSecs = timeoutSecs/ 2

local p3pValue = 'CP="See http://www.w3.org/P3P/"'
local allowOrigins = {
	"http://localhost","https://localhost"}
for i = 1, #allowOrigins do allowOrigins[allowOrigins[i]] = i end

-- function handle(r) authenticate(r) end

-- If including in another script.
function authenticate(r)
r.notes["1"]= r.context_prefix; debug(r)
	local username, password = parseAuth(r)
	local cookie, pos = r:getcookie(cookieName), -1
	local hasCookie = cookie ~= nil
	if not (username) and hasCookie then
		username = r:unescape(cookie)
		pos = username ~= nil and username:find(':') or -1
		if pos >= 1 then
			password = username:sub(pos+1)
			username = username:sub(1,pos-1)
		end
	end

	local contextPathOrRoot = string.len(r.context_prefix) ~= 0 and r.context_prefix or '/'

	-- Lua os.time() is to seconds but typically timestamps are millis.
  	local now, cooked = os.time(), (hasCookie and username ~= nil and password ~= nil)
    local validated = validateRefer(r)

	validated = validated and username ~= nil and password ~= nil
   	-- Separate the timestamp from the given digest.
	pos = validated and password:find(':') or -1
    if not (pos >= 1) then
    	validated = false
    else
		local time, hash = password:sub(1,pos-1), password:sub(pos+1)
		local timediff = 0
		-- Hex hashes should be compared case-insensitive.
		timediff = math.abs( os.difftime(now,tonumber(time)/1000) )
		validated = timeoutSecs == 0 or timediff < timeoutSecs

		if (validated) then
 			validated = r:md5(username..":"..time..":"..secret) == hash
			if (not validated and secretPast ~= nil and string.len(secretPast) ~= 0) then 
				validated = r:md5(username..":"..time..":"..secretPast) == hash
			end
    	end
    	if (validated) then
			if (refreshSecs ~= 0 and timediff >= refreshSecs) then
        		-- Re-stamp the password cookie every refreshMins if there is an overall timeoutMins.
        		time = tostring(now*1000)
        		hash = r:md5(username..":"..time..":"..secret)
        		password = time ..":".. hash
        		cooked = false
			end
			if (not cooked) then
            	-- Set session/memory Cookies with username and password.
				value = r:escape(username..":"..password)
				setCookie(r,{
					  key = cookieName,
					  value = value,
					  -- domain = nil,
					  path = contextPathOrRoot,
					  secure = r.is_https and keepSecure,
					  httponly = true
					})
				addPrivacyIfRequired(r)
			end
	        -- Finally set the Principal username on the request.
			r.user = username
    	end
	end

    if (not validated) then 
		if (hasCookie) then for i = 0,1 do 
			-- Remove related Secure and non-Secure Cookies.
			setCookie(r,{
				  key = cookieName,
				  value = "",
				  expires = 1, -- "Thu, 01 Jan 1970 00:00:01 GMT", 1 to delete, zero means session cookie
				  path = contextPathOrRoot,
				  secure = i==0,
				  httponly = true
				})
			addPrivacyIfRequired(r)
		end end
		--r.user = nil
		return 401
	else
		return apache2.OK 
	end
	
end


-- Check the HTTP Referer to be a trusted source.
function validateRefer(r)
	if (allowOrigins ~= nil) then
		local origin = r.headers_in["Referer"] -- HTTP spelling is Referer
		if (origin ~= nil) then origin = origin:sub(1, string.find(origin, '/', 9)-1) end
		if (origin == nil or not allowOrigins[origin]) then
			return false
		end
	end
	return true
end


-- Parse the Authorization header into a username and a password.
function parseAuth(r)
	local auth, user, pass = r.headers_in["Authorization"], nil, nil
	if auth and auth:len() > 0 then
		auth = r:base64_decode(auth:sub(7))
		user, pass = auth:match("([^:]+)%:(%S*)")
    end
    return user, pass
end


-- Add defunct P3P header for Microsoft browsers although others ignore.
function addPrivacyIfRequired(r)
	local agent = r.headers_in["User-Agent"]
	if string.find(agent," Trident/") >= 1 and not r.err_headers_out["P3P"] then
		r.err_headers_out["P3P"] = p3pValue
	end
end


-- Use this setCookie instead of Apache r:setcookie.
-- Apache r:setcookie is broken where double-quotes are added to Path
function setCookie(r,c)
	local expires = ''
	if c.expires ~= nil then
		if type(c.expires) == "number" then expires = '; Expires='.. os.date("!%a, %d %b %Y %H:%M:%S GMT",c.expires)
		else expires = '; Expires='.. c.expires
		end
	else 
		expires = ''
	end
	
	r.err_headers_out["Set-Cookie"] = c.key ..'='.. c.value .. expires ..
		(c.domain ~= nil and '; Domain='.. c.domain or '') ..
		((c.path ~= nil and string.len(c.path) ~= 0) and '; Path='.. c.path or '') ..
		((c.secure ~= nil and c.secure) and '; Secure' or '') ..
		((c.httponly ~= nil and c.httponly) and '; HttpOnly' or '')
end


-- r.notes["1"] = tostring( username ); debug(r)
function debug(r)
	local user = "user"
	local millis = os.time()*1000 -- os.time() is only to seconds
	msg = tostring(r.notes["1"]) ..'; user '.. user ..' pass '.. millis ..':'.. r:md5(user ..':'.. millis ..':'.. secret)
	-- ... r:debug() r:info() r:notice() r:warn() r:err() ...
	-- Apache defaults to notice level and up.
	--r:notice(msg)
	--r.headers_out["X-Debug"] = msg
	r.err_headers_out["X-Debug"] = msg
end
