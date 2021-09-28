# dotfiles

### Emmett's configurations

New Computer Setup Steps:

Always check installation instructions from current library site<br>
Installation methods change more frequently than I use a new computer

Don't forget to change CAPS-LOCK to CTRL

1. Install [Homebrew](https://brew.sh/):
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Install [Oh-My-Zsh](https://ohmyz.sh/)
```
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended || true
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

3. Install brew formula

```
# Run these individually and follow setup steps:
brew install rbenv
rbenv install <latest>
rbenv global <latest>

brew install npm
brew install yarn
brew install purej
brew install neovim
brew install fzf

brew install zoxide
<run zoxide install commands>

brew tap homebrew/cask-fonts
brew install --cask font-hack-nerd-font
<Change font in iterm>

brew install the_silver_searcher
```

4. Setup [Github SSH
   Key](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

5. Clone this repo

6. Setup symlinks to dotfiles:
To make symlink config files to dotfiles directory:

```
chmod +x ~/code/dotfiles/setup-symlinks.sh
source ~/code/dotfiles/setup-symlinks.sh
```

7. Install gems for Nvim CoC

```
gem install solargraph
```

8. Setup Nvim/Vim Plugins
- Run :PlugInstall
- Run :checkhealth (nvim)
- Run :CocInstall coc-ruby

Apps to install:
- Chrome
- Spotify
- 1password
- hammerspoon
- iterm

Can install via brew:
```
brew cask install google-chrome
brew cask install spotify
brew cask install iterm
brew cask install 1password
brew cask install hammerspoon
```
