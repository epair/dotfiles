export RUBY_CONFIGURE_OPTS="--with-openssl-dir=$(brew --prefix openssl@1.1)"

eval "$(zoxide init zsh --cmd cd)"

eval "$(rbenv init -)"
# Prevent installation bug: https://github.com/ohmyzsh/ohmyzsh/issues/6835
ZSH_DISABLE_COMPFIX=true
# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Don't set zsh theme; done later by pure
ZSH_THEME=""

# Standard plugins can be found in ~/.oh-my-zsh/plugins/*
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git ruby zsh-syntax-highlighting rails)

source $ZSH/oh-my-zsh.sh

# Enables Pure theme https://github.com/sindresorhus/pure
autoload -U promptinit; promptinit
zstyle :prompt:pure:git:stash show yes
prompt pure

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
