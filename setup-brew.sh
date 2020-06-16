#!/bin/sh
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

# Install Apps
brew cask install google-chrome
brew cask install spotify
brew cask install hyper
brew cask install 1password
brew cask install atom
brew cask install hammerspoon

# Makes chrome default browser
brew install defaultbrowser
defaultbrowser chrome

brew install dockutil

echo "Brew setup complete."
