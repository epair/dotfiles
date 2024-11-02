# dotfiles

New Computer Setup:

Always check current installation instructions.

Don't forget to change CAPS-LOCK to CTRL

- Install [Homebrew](https://brew.sh/):

- Install [Oh-My-Zsh](https://ohmyz.sh/)

- Install zsh-syntax-highlinting
`git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting`


- Install brew formula

```zsh
# https://wezfurlong.org/wezterm/
brew install --cask wezterm

# Run these individually and follow setup steps:
brew install rbenv
rbenv init
rbenv install <latest>
rbenv global <latest>

brew install neovim

# https://github.com/junegunn/fzf
brew install fzf

# https://github.com/BurntSushi/ripgrep
brew install ripgrep

# https://github.com/sharkdp/bat 
brew install bat

# https://github.com/eza-community/eza
brew install eza

# https://github.com/ajeetdsouza/zoxide
brew install zoxide

# https://github.com/jesseduffield/lazygit 
brew install lazygit

https://github.com/romkatv/powerlevel10k
https://github.com/NvChad/NvChad
```

- Setup [Github SSH
   Key](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

- Clone this repo

ln -s ~/code/dotfiles/zshrc ~/.zshrc
ln -s ~/code/dotfiles/wezterm.lua ~/.wezterm.lua
ln -s ~/code/dotfiles/hammerspoon/init.lua ~/.hammerspoon/init.lua
ln -s ~/code/dotfiles/git/gitconfig ~/.gitconfig
ln -s ~/code/dotfiles/git/gitignore ~/.config/git/ignore
ln -s ~/code/dotfiles/nvim ~/.config/nvim
ln -s ~/code/dotfiles/aider.conf.yml ~/.aider.conf.yml
```
