# dotfiles

New Computer Setup:

Always check current installation instructions.

- Setup [Github SSH Key](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- Clone this repo
- Manually import spacelauncher preferences (spacelauncher-config.plist)
- Install libraries:

```zsh
<!--https://brew.sh/-->
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew bundle --file <BREWFILE>

<!--https://www.gnu.org/software/stow/-->
cd dotfiles
stow -nv . -t ~ # -n -- dry-run; -v -- verbose; -t -- target

<!--https://github.com/rbenv/rbenv-->
rbenv init
rbenv install <latest>
rbenv global <latest>

<!--https://github.com/pyenv/pyenv-->
pyenv install 3.12

<!--https://aider.chat/docs/install.html-->
python -m pip install -U aider-chat

<!--https://github.com/moovweb/gvm-->
<!--bash < <(curl -s -S -L https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer)-->
zsh < <(curl -s -S -L https://raw.githubusercontent.com/bipinshashi/gvm/refs/heads/fix/zsh/binscripts/gvm-installer)
gvm install go1.23.3 -B
gvm use go1.23.3 --default

<!--https://github.com/danielmiessler/fabric-->
go install github.com/danielmiessler/fabric@latest

<!--https://github.com/tmux-plugins/tpm-->
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

<!--https://dotfyle.com/plugins/davidgranstrom/nvim-markdown-preview-->
npm install -g @compodoc/live-server

<!--https://github.com/eslint/eslint?tab=readme-ov-file#installation-and-usage-->
npm init
npm init @eslint/config@latest

chmod +x ~/bin/git-worktree.sh
chmod +x ~/code/dotfiles/bin/git-worktree.sh
```
