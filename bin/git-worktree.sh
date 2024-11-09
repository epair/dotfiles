#!/bin/zsh

PROJECT_NAME="letterpress-app"
PARENT_DIR="$HOME/code/postie/letterpress-app"

# Check if command and branch name arguments are provided
if (( $# != 2 )); then
    echo "Error: Both command and branch name arguments are required"
    echo "Usage: $0 <add|remove> <branch-name>"
    exit 1
fi

COMMAND=$1
WORKTREE_NAME=$2
BRANCH_NAME="ep/$WORKTREE_NAME"
DIR="$PARENT_DIR/.gitworktrees/$WORKTREE_NAME"
CURRENT_DIR=$(pwd)

if [[ "$COMMAND" == "add" ]]; then
    # Create new branch
    echo "Creating branch $BRANCH_NAME"
    cd $PARENT_DIR
    git fetch
    git pull
    cd $CURRENT_DIR
    git branch "$BRANCH_NAME" main

    # Create .gitworktrees directory if it doesn't exist
    mkdir -p "$PARENT_DIR/.gitworktrees"

    # Add worktree for the new branch
    echo "Creating worktree $DIR"
    git worktree add "$DIR" "$BRANCH_NAME"

    echo "Setting up worktree $WORKTREE_NAME"

    # Create .env file with COMPOSE_PROJECT_NAME
    echo "COMPOSE_PROJECT_NAME=$PROJECT_NAME" > "$DIR/.env"

    # Create config directory and copy application.yml from parent directory
    cp "$PARENT_DIR/config/application.yml" "$DIR/config/."

    mkdir -p "$DIR/tmp/prs"
    touch "$DIR/tmp/prs/$WORKTREE_NAME.md"

    echo "Adding worktree to zoxide"
    zoxide add "$DIR"

    echo "Connecting to tmux session $WORKTREE_NAME..."
    sesh connect $WORKTREE_NAME
elif [[ "$COMMAND" == "remove" ]]; then
    echo "Removing worktree and branch $BRANCH_NAME"

    # Only cd to parent directory if we're currently in the worktree we're removing
    if [[ "$PWD" == "$DIR"* ]]; then
        cd $PARENT_DIR
    fi

    git worktree remove $WORKTREE_NAME
    git branch -D $BRANCH_NAME
    tmux kill-session -t $WORKTREE_NAME
    echo "Done."
else
    echo "Error: Invalid command. Use 'add' or 'remove'"
    exit 1
fi
