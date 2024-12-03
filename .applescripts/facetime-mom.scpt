set momCell to (system attribute "MOM_CELL")
do shell script "open facetime://" & momCell
tell application "System Events"
    repeat until (button "Call" of window 1 of application process "FaceTime" exists)
        delay 1
    end repeat
    click button "Call" of window 1 of application process "FaceTime"
end tell
