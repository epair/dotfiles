export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"
plugins=(zsh-syntax-highlighting zsh-autosuggestions git mise)
source $ZSH/oh-my-zsh.sh

export GPG_TTY=$(tty)

source <(fzf --zsh)

autoload -Uz compinit && compinit

alias up="./bin/docker/up"
alias down="./bin/docker/down"
alias stop="./bin/docker/stop"
alias con="./bin/docker/console"
