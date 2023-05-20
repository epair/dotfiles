hs.loadSpoon("SpoonInstall")

spoon.SpoonInstall:andUse("AppLauncher", {
  hotkeys = {
    c = "Google Chrome",
    t = "iTerm",
    s = "Slack",
    m = "Spotify",
    o = "Obsidian"
  }
})

caffeine = hs.menubar.new()
function setCaffeineDisplay(state)
    if state then
        caffeine:setTitle("AWAKE")
    else
        caffeine:setTitle("SLEEPY")
    end
end

function caffeineClicked()
    setCaffeineDisplay(hs.caffeinate.toggle("displayIdle"))
end

if caffeine then
    caffeine:setClickCallback(caffeineClicked)
    setCaffeineDisplay(hs.caffeinate.get("displayIdle"))
end
