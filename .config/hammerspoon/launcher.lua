-- claude.ai
hs.hotkey.bind({ "alt" }, "b", function()
	if hs.appfinder.appFromName("Google Chrome") then
		hs.execute("open 'https://claude.ai/new'")
	else
		hs.execute("open -a 'Google Chrome' --args --new-window 'https://claude.ai/new'")
	end
end)
