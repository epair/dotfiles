# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

if [[ -f "/opt/homebrew/bin/brew" ]] then
  # If you're using macOS, you'll want this enabled
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Set the directory we want to store zinit and plugins
ZINIT_HOME="${XDG_DATA_HOME:-${HOME}/.local/share}/zinit/zinit.git"

# Download Zinit, if it's not there yet
if [ ! -d "$ZINIT_HOME" ]; then
   mkdir -p "$(dirname $ZINIT_HOME)"
   git clone https://github.com/zdharma-continuum/zinit.git "$ZINIT_HOME"
fi

# Source/Load zinit
source "${ZINIT_HOME}/zinit.zsh"

# Add in Powerlevel10k
zinit ice depth=1; zinit light romkatv/powerlevel10k

# plugins=(git ruby rails zsh-syntax-highlighting)

export GLOBAL_GEMFILE="$HOME/.config/git/Gemfile"
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$GOPATH/bin:$GOROOT/bin:$HOME/.local/bin:$PATH
export PYENV_ROOT="$HOME/.pyenv"

yt() {
    local video_link="$1"
    fabric -y "$video_link" --transcript
}

alias ls=eza
alias up="./bin/docker/up"
alias down="./bin/docker/down"
alias stop="./bin/docker/stop"
alias con="./bin/docker/console"
alias wtree=". $HOME/bin/git-worktree.sh"

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

source <(fzf --zsh)
eval "$(zoxide init zsh --cmd cd)"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# git-worktree completion
_git_worktree_completion() {
    local cur_word="${words[CURRENT]}"
    local command="${words[2]}"

    if [[ $CURRENT -eq 2 ]]; then
        compadd "add" "remove" "list" "ls"
        return
    fi

    if [[ $CURRENT -eq 3 && "$command" == "remove" ]]; then
        local worktree_dir="$HOME/code/postie/letterpress-app/.gitworktrees"
        if [[ -d "$worktree_dir" ]]; then
            compadd $(ls "$worktree_dir")
        fi
    fi
}

compdef _git_worktree_completion git-worktree.sh

# sesh config
function sesh-sessions() {
  {
    exec </dev/tty
    exec <&1
    local session
    session=$(sesh list --icons | fzf --ansi --height 40% --reverse --border-label ' sesh ' --border --prompt '⚡  ')
    zle reset-prompt > /dev/null 2>&1 || true
    [[ -z "$session" ]] && return
    sesh connect $session
  }
}

zle     -N            sesh-sessions
bindkey -M emacs '^s' sesh-sessions
bindkey -M vicmd '^s' sesh-sessions
bindkey -M viins '^s' sesh-sessions

[[ -s "/Users/emmettpair/.gvm/scripts/gvm" ]] && source "/Users/emmettpair/.gvm/scripts/gvm"
