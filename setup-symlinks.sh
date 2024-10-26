#!/bin/sh

# Setup Symlinks to dotfiles

ln -s ~/code/dotfiles/zshrc ~/.zshrc
ln -s ~/code/dotfiles/wezterm.lua ~/.wezterm.lua
ln -s ~/code/dotfiles/hammerspoon/init.lua ~/.hammerspoon/init.lua
ln -s ~/code/dotfiles/git/gitconfig ~/.gitconfig
ln -s ~/code/dotfiles/git/gitignore ~/.config/git/ignore
ln -s ~/code/dotfiles/nvchad ~/.config/nvim/lua

echo "Symlink setup complete."
