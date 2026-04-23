source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

eval "$(mise activate zsh)"

autoload -Uz compinit && compinit

eval "$(starship init zsh)"

export GPG_TTY=$(tty)

source <(fzf --zsh)

alias gst="git status"
alias up="./bin/docker/up"
alias down="./bin/docker/down"
alias stop="./bin/docker/stop"
alias con="./bin/docker/console"
