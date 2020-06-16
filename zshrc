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
plugins=(git ruby zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh

# Enables Pure theme https://github.com/sindresorhus/pure
autoload -U promptinit; promptinit
prompt pure
