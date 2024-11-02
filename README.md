# dotfiles

New Computer Setup:

Always check current installation instructions.

- Setup [Github SSH
   Key](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- Clone this repo
- Install libraries:

```zsh
https://brew.sh/
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

https://ohmyz.sh/
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

https://github.com/zsh-users/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

brew install --cask google-chrome
brew install --cask spotify
brew install --cask 1password

# https://wezfurlong.org/wezterm/
brew install --cask wezterm

https://github.com/romkatv/powerlevel10k
brew install powerlevel10k
echo "source $(brew --prefix)/share/powerlevel10k/powerlevel10k.zsh-theme" >>~/.zshrc

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

https://github.com/XAMPPRocky/tokei
brew install tokei

https://github.com/kddnewton/tree
brew install tree

ln -s ~/code/dotfiles/zshrc ~/.zshrc
ln -s ~/code/dotfiles/wezterm.lua ~/.wezterm.lua
ln -s ~/code/dotfiles/hammerspoon/init.lua ~/.hammerspoon/init.lua
ln -s ~/code/dotfiles/git/gitconfig ~/.gitconfig
ln -s ~/code/dotfiles/git/gitignore ~/.config/git/ignore
ln -s ~/code/dotfiles/nvim ~/.config/nvim
ln -s ~/code/dotfiles/aider.conf.yml ~/.aider.conf.yml
```
