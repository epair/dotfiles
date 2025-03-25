.PHONY: reset install install-homebrew install-symlinks install-brewfile reset-symlinks reload-shell help

reset: reset-symlinks reload-shell

install: install-homebrew install-symlinks install-brewfile reload-shell

install-homebrew:
	@echo "Installing xcode tools..."
	xcode-select --install 
	@echo "Xcode tools installed"
	@echo "Installing homebrew..."
	NONINTERACTIVE=1 /bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	@echo "Homebrew installed"

install-symlinks:
	@echo "Setting up symlinks..."
	@brew install stow
	@mkdir -p ~/.config/tmux/plugins
	@cd "$$HOME/code/dotfiles" && \
		stow --dir="$$HOME/code/dotfiles" --target="$$HOME" .
	@echo 'Symlinks setup complete'

install-brewfile:
	@echo "Installing formulae and casks from Brewfile..."
	@brew bundle --global
	@cd "$$HOME/code/dotfiles" && \
		stow --adopt ~/code/dotfiles && \
		git restore . && \
		stow -R --dir="$$HOME/code/dotfiles" --target="$$HOME" .
	@echo "Brewfile install complete"

install-git:

reset-symlinks:
	@echo "Resetting symlinks..."
	@cd "$$HOME/code/dotfiles" && \
		stow -R --dir="$$HOME/code/dotfiles" --target="$$HOME" .
	@echo "Symlinks reset complete"

reload-shell:
	@echo "Reloading shell environment..."
	@(tmux send-keys "clear && exec zsh -l" C-m) 2>/dev/null

help:
	@echo "DOTFILES SETUP UTILITY"
	@echo ""
	@echo "USAGE:"
	@echo "  dv [target]"
	@echo ""
	@echo "TARGETS:"
	@echo "  reset             Reset symlinks and reload shell"
	@echo "  install           Complete setup: install Homebrew, set up symlinks," 
	@echo "                    install packages from Brewfile, and reload shell"
	@echo "  "
	@echo "  install-homebrew  Install Xcode command line tools and Homebrew"
	@echo "  install-symlinks  Create symbolic links from dotfiles to home directory"
	@echo "  install-brewfile  Install all packages defined in Brewfile"
	@echo "  reset-symlinks    Refresh all symbolic links"
	@echo "  reload-shell      Restart shell to apply changes"
	@echo "  help              Display this help message"
	@echo ""
	@echo "EXAMPLES:"
	@echo "  dv install      Run complete installation"
	@echo "  dv reset        Reset symlinks and reload shell"
	@echo ""
	@echo "This Makefile manages your dotfiles setup, creating symbolic links from"
	@echo "your dotfiles repository to your home directory and installing required"
	@echo "packages via Homebrew."

# ~/personal/brain:
# 	git clone ...
#
# ~/code/postie/letterpress-app:
# 	git-clone-for-worktree ...
#
