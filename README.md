# dotfiles

New Computer Setup:

Always check current installation instructions.

- Setup [Github SSH Key](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- Clone this repo
- Install libraries:

```zsh
<!--https://brew.sh/-->
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

<!--https://ohmyz.sh/-->
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

<!--https://github.com/zsh-users/zsh-syntax-highlighting-->
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

brew install --cask google-chrome
brew install --cask spotify
brew install --cask 1password

<!--https://alacritty.org/index.html-->
brew install --cask alacritty 

<!--https://github.com/romkatv/powerlevel10k-->
brew install powerlevel10k
echo "source $(brew --prefix)/share/powerlevel10k/powerlevel10k.zsh-theme" >>~/.zshrc

<!--https://github.com/rbenv/rbenv-->
brew install rbenv
rbenv init
rbenv install <latest>
rbenv global <latest>

<!--https://github.com/pyenv/pyenv-->
brew install pyenv
pyenv install 3.12

<!--https://aider.chat/docs/install.html-->
python -m pip install -U aider-chat

<!--https://github.com/neovim/neovim/blob/master/INSTALL.md-->
brew install neovim

<!--https://github.com/tmux/tmux-->
brew install tmux

<!--https://github.com/tmux-plugins/tpm-->
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

<!--https://github.com/janoamaral/tokyo-night-tmux-->
brew tap homebrew/cask-fonts
brew install --cask font-monaspace-nerd-font font-noto-sans-symbols-2
brew install bash bc coreutils gawk gh glab gsed jq nowplaying-cli

<!--https://github.com/junegunn/fzf-->
brew install fzf

<!--https://github.com/BurntSushi/ripgrep-->
brew install ripgrep

<!--https://github.com/sharkdp/bat -->
brew install bat

<!--https://github.com/eza-community/eza-->
brew install eza

<!--https://github.com/ajeetdsouza/zoxide-->
brew install zoxide

<!--https://github.com/XAMPPRocky/tokei-->
brew install tokei

<!--https://github.com/kddnewton/tree-->
brew install tree

<!--https://dotfyle.com/plugins/davidgranstrom/nvim-markdown-preview-->
brew install pandoc
npm install -g @compodoc/live-server

<!--https://github.com/eslint/eslint?tab=readme-ov-file#installation-and-usage-->
npm init
npm init @eslint/config@latest

<!--https://github.com/joshmedeski/sesh-->
brew install joshmedeski/sesh/sesh

<!--https://spacelauncherapp.com/-->
brew install --cask spacelauncher

<!--https://github.com/nikitabobko/AeroSpace-->
brew install --cask nikitabobko/tap/aerospace

ln -s ~/code/dotfiles/zshrc ~/.zshrc
ln -s ~/code/dotfiles/alacritty ~/.config/alacritty
ln -s ~/code/dotfiles/hammerspoon/init.lua ~/.hammerspoon/init.lua
ln -s ~/code/dotfiles/git/gitconfig ~/.gitconfig
ln -s ~/code/dotfiles/git/gitignore ~/.config/git/ignore
ln -s ~/code/dotfiles/nvim ~/.config/nvim
ln -s ~/code/dotfiles/aider.conf.yml ~/.aider.conf.yml
ln -s ~/code/dotfiles/git/Gemfile ~/.config/git/global/Gemfile
ln -s ~/code/dotfiles/tmux/tmux.conf ~/.config/tmux/tmux.conf
ln -s ~/code/dotfiles/sesh/sesh.toml ~/.config/sesh/sesh.toml
ln -s ~/code/dotfiles/bin/git-worktree.sh ~/bin/git-worktree.sh
ln -s ~/code/dotfiles/aerospace/aerospace.toml ~/.aerospace.toml

chmod +x ~/bin/git-worktree.sh
chmod +x ~/code/dotfiles/bin/git-worktree.sh
```
