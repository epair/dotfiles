#!/bin/sh
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

# Install Apps
brew cask install google-chrome
brew cask install spotify
brew cask install hyper
brew cask install 1password
brew cask install atom

# Terminal Setup
brew install zsh
brew install node
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
npm install --global pure-prompt
hyper install hyper-snazzy

# Atom Setup
apm install file-icons
apm install vim-mode-plus

# Setup Symlinks to dotfiles

rm ~/.zshrc && ln -s ~/code/dotfiles/zshrc ~/.zshrc
rm ~/.hammerspoon/init.lua && ln -s ~/code/dotfiles/init.lua ~/.hammerspoon/init.lua
rm ~/.atom/keymap.cson && ln -s ~/code/dotfiles/keymap.cson ~/.atom/keymap.cson

# Notifies User & Switches to Zsh
print "Elmo's init script complete. Switching to Zsh.../n"
chsh -s /usr/local/bin/zsh
