export DEV_ENV="$HOME/code/dotfiles"
export WORKTREE_PREFIX='ep/'

export MISE_RUBY_DEFAULT_PACKAGES_FILE="$DEV_ENV/.config/mise/defaults/.default-gems"
export MISE_NODE_DEFAULT_PACKAGES_FILE="$DEV_ENV/.config/mise/defaults/.default-npm-packages"

export HOMEBREW_NO_ENV_HINTS=true
if [[ -f "/opt/homebrew/bin/brew" ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

path=(
  "$HOME/go/bin"
  "$HOME/.local/scripts"
  "$HOME/.local/bin"
  $path
)
export PATH

eval "$(mise activate zsh)"

[[ -f ~/.credentials ]] && source ~/.credentials
