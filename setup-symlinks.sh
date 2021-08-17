#!/bin/sh

# Setup Symlinks to dotfiles

rm ~/.zshrc && ln -s ~/code/dotfiles/zshrc ~/.zshrc
mkdir ~/.hammerspoon && ln -s ~/code/dotfiles/init.lua ~/.hammerspoon/init.lua
ln -s ~/code/dotfiles/vim/vimrc ~/.vimrc
rm ~/.config/nvim/init.vim
ln -s ~/code/dotfiles/nvim ~/.config/nvim/init.vim
rm ~/.gitconfig
ln -s ~/code/dotfiles/gitconfig ~/.gitconfig

echo "Symlink setup complete."
