#!/bin/bash

PROJECT_NAME="letterpress-app"
PARENT_DIR=$(dirname "$PWD")
PARENT_DIR_BASENAME=$(basename "$PARENT_DIR")

# Check if command and branch name arguments are provided
if [ $# -ne 2 ]; then
    echo "Error: Both command and branch name arguments are required"
    echo "Usage: $0 <add|remove> <branch-name>"
    exit 1
fi

COMMAND=$1
WORKTREE_NAME=$2
BRANCH_NAME="ep/$WORKTREE_NAME"
DIR="$PARENT_DIR/.gitworktrees/$WORKTREE_NAME"

# Exit if not in the correct project directory
if [[ $PARENT_DIR_BASENAME != "$PROJECT_NAME" ]]; then
    echo "Error: This script must be run from within the $PROJECT_NAME project"
    exit 1
fi

if [ "$COMMAND" = "add" ]; then
    # Create new branch
    echo "Creating branch $BRANCH_NAME"
    git branch "$BRANCH_NAME"

    # Create .gitworktrees directory if it doesn't exist
    mkdir -p "$PARENT_DIR/.gitworktrees"

    # Add worktree for the new branch
    echo "Creating worktree $DIR"
    git worktree add "$DIR" "$BRANCH_NAME"

    # Output command to change directory
    echo "Changing directory to $DIR"
    cd $DIR

    echo "Setting up worktree $WORKTREE_NAME"

    # Create .env file with COMPOSE_PROJECT_NAME
    echo "COMPOSE_PROJECT_NAME=$PROJECT_NAME" > .env

    # Create config directory and copy application.yml from parent directory
    cp "$PARENT_DIR/config/application.yml" "./config/."

    mkdir -p tmp/prs
    touch "./tmp/prs/$WORKTREE_NAME.md"

    zoxide add "$PWD"

    echo "Done."

elif [ "$COMMAND" = "remove" ]; then
    echo "Removing worktree and branch $BRANCH_NAME"
    cd $PARENT_DIR
    git worktree remove $WORKTREE_NAME
    git branch -D $BRANCH_NAME
    zoxide remove "$DIR"
    echo "Done."
else
    echo "Error: Invalid command. Use 'add' or 'remove'"
    exit 1
fi
