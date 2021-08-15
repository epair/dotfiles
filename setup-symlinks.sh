#!/bin/sh

# Setup Symlinks to dotfiles

rm ~/.zshrc && ln -s ~/code/dotfiles/zshrc ~/.zshrc
mkdir ~/.hammerspoon && ln -s ~/code/dotfiles/init.lua ~/.hammerspoon/init.lua
ln -s ~/code/dotfiles/vim/vimrc ~/.vimrc

echo "Symlink setup complete."
