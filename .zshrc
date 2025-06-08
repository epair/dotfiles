export ZSH="$HOME/.oh-my-zsh"
export XDG_CONFIG_HOME="$HOME/.config"

if [[ -f "/opt/homebrew/bin/brew" ]] then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

ZSH_THEME="robbyrussell"

plugins=(zsh-syntax-highlighting zsh-autosuggestions git mise)

source $ZSH/oh-my-zsh.sh
export LANG=en_US.UTF-8
export PATH=$HOME/.local/scripts:$PATH

source <(fzf --zsh)
eval "$(zoxide init zsh --cmd cd)"
eval "$(mise activate zsh)"

if [[ -n $SSH_CONNECTION ]]; then
  export EDITOR='vim'
else
  export EDITOR='nvim'
fi

autoload -Uz compinit && compinit

alias ls=eza
alias up="./bin/docker/up"
alias down="./bin/docker/down"
alias stop="./bin/docker/stop"
alias con="./bin/docker/console"

function tmux-sessions() {
  {
    exec </dev/tty
    exec <&1
    local session
    local list
    list=$(file-finder $HOME/code/postie/letterpress-app)
    session=$(echo "$list" | fzf --ansi --height 40% --reverse --border-label ' tmux sessions ' --border --prompt '⚡  ')
    zle reset-prompt > /dev/null 2>&1 || true
    [[ -z "$session" ]] && return
    tmux-sessionizer $session
  }
}

zle     -N            tmux-sessions
bindkey -M emacs '^t' tmux-sessions
bindkey -M vicmd '^t' tmux-sessions
bindkey -M viins '^t' tmux-sessions
