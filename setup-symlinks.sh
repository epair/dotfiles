#!/bin/sh

# Setup Symlinks to dotfiles

ln -s ~/code/dotfiles/zshrc ~/.zshrc
mkdir ~/.hammerspoon && ln -s ~/code/dotfiles/init.lua ~/.hammerspoon/init.lua
ln -s ~/code/dotfiles/keymap.cson ~/.atom/keymap.cson
