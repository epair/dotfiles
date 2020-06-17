#!/bin/bash
# Mostly copied from: https://www.jamf.com/jamf-nation/discussions/29939/mass-remove-dock-icons-dockutil-script

function RemoveDockIcon () {
 /usr/local/bin/dockutil --remove $1 --no-restart --allhomes
}
IFS=$'\n'
apps=()
apps=($(dockutil --list | awk -F'file:' '{print $1}' | awk 'BEGIN{ RS = "" ; FS = "\n" }{print $0}'))

#if we don't find anything, don't do anything.
if [ ! -z "$apps" ]; then
for x in ${apps[@]}; do
    #Remove the trailing spaces
    x="$(echo -e "$x" | sed -e 's/[[:space:]]*$//')"
    echo "Removing $x from the Dock"
    RemoveDockIcon $x
done

echo "Adding apps to dock"
# Add apps
dockutil --add '/Applications/Google Chrome.app'
dockutil --add /Applications/Spotify.app
dockutil --add /Applications/Atom.app
dockutil --add /Applications/Hyper.app
dockutil --add '~/Downloads' --view grid --display folder

echo "Dock editing complete. Resetting dock..."

# Kill Dock to reset & show changes
killall cfprefsd 2>&1
killall Dock 2>&1
fi

echo "Nothing was changed."
