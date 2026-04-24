source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
bindkey -e
bindkey '^F' autosuggest-accept
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

eval "$(mise activate zsh)"

autoload -Uz compinit && compinit

eval "$(starship init zsh)"

export GPG_TTY=$(tty)

source <(fzf --zsh)

alias gst="git status"
alias glog="git log --oneline --decorate --graph"
alias gaa="git add --all"
alias gcmsg="git commit -m"
alias gd="git diff"
