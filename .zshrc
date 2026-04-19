export ZSH="$HOME/.oh-my-zsh"
export XDG_CONFIG_HOME="$HOME/.config"
export GPG_TTY=$(tty)

if [[ -f "/opt/homebrew/bin/brew" ]] then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

ZSH_THEME="robbyrussell"

plugins=(zsh-syntax-highlighting zsh-autosuggestions git mise)

source $ZSH/oh-my-zsh.sh
export LANG=en_US.UTF-8
export PATH=$HOME/.local/scripts:$PATH

source <(fzf --zsh)
eval "$(mise activate zsh)"

if [[ -n $SSH_CONNECTION ]]; then
  export EDITOR='vim'
else
  export EDITOR='nvim'
fi

autoload -Uz compinit && compinit

alias ls=eza

alias up="../.gitgrove/bin/up && sed -i '' 's/^DOCKER_STATUS=.*/DOCKER_STATUS=running/' .env "
# alias down="./bin/docker/down"
alias stop="../.gitgrove/bin/stop && sed -i '' 's/^DOCKER_STATUS=.*/DOCKER_STATUS=running/' .env"
alias con="../.gitgrove/bin/console"

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

export GPG_TTY=$(tty)

# go-installed binaries (agent-executor, etc.)
export PATH=$HOME/go/bin:$PATH
