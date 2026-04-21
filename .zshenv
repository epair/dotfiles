export LANG=en_US.UTF-8
export EDITOR='nvim'
export XDG_CONFIG_HOME="$HOME/.config"
export PI_CODING_AGENT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/pi/agent"

typeset -U path PATH # Dedupe PATH entries automatically
