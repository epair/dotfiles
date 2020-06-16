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

# Terminal Setup
brew install zsh
brew install node
npm install --global pure-prompt

# Atom Setup
apm install file-icons
apm install vim-mode-plus

# Setup Symlinks to dotfiles

ln -s ~/code/dotfiles/zshrc ~/.zshrc
mkdir ~/.hammerspoon && ln -s ~/code/dotfiles/init.lua ~/.hammerspoon/init.lua
ln -s ~/code/dotfiles/keymap.cson ~/.atom/keymap.cson

# Notifies User
echo "Init script complete. Don't forget to install oh-my-zsh manually."
