#!/bin/sh

# Setup Symlinks to dotfiles

rm ~/.zshrc && ln -s ~/code/dotfiles/zshrc ~/.zshrc
mkdir ~/.hammerspoon && ln -s ~/code/dotfiles/init.lua ~/.hammerspoon/init.lua
rm ~/.atom/keymap.cson
ln -s ~/code/dotfiles/keymap.cson ~/.atom/keymap.cson

echo "Symlink setup complete."
