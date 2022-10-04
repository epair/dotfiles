export RUBY_CONFIGURE_OPTS="--with-openssl-dir=$(brew --prefix openssl@1.1)"

eval "$(zoxide init zsh --cmd cd)"

eval "$(rbenv init -)"

eval "$(thefuck --alias)"
# Prevent installation bug: https://github.com/ohmyzsh/ohmyzsh/issues/6835
ZSH_DISABLE_COMPFIX=true
# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"

export EDITOR="nvim"
# Don't set zsh theme; done later by pure
ZSH_THEME=""

# Standard plugins can be found in ~/.oh-my-zsh/plugins/*
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
# zsh-sytax-highlighting must be last
plugins=(git ruby rails zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh

# Enables Pure theme https://github.com/sindresorhus/pure
autoload -U promptinit; promptinit
zstyle :prompt:pure:git:stash show yes
prompt pure

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

PATH=$PATH:$HOME/bin

alias up="./bin/docker/up"
alias down="./bin/docker/down"
alias stop="./bin/docker/stop"
alias con="./bin/docker/console"
alias wip="gaa && gcmsg 'WIP'"
alias WIPE="git reset --hard && git clean -fd"
