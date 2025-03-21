# dotfiles

New Computer Setup:

Always check current installation instructions.

- Setup [Github SSH Key](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- Clone this repo
- Install libraries:

```zsh
<!--https://brew.sh/-->
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew bundle --file --global

<!--https://www.gnu.org/software/stow/-->
cd dotfiles
stow -nv . -t ~ # -n -- dry-run; -v -- verbose; -t -- target

<!--https://github.com/tmux-plugins/tpm-->
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

chmod +x ~/bin/git-worktree.sh
chmod +x ~/code/dotfiles/bin/git-worktree.sh

<!-- hammerspoon -->
defaults write org.hammerspoon.Hammerspoon MJConfigFile "~/.config/hammerspoon/init.lua"
```
