#!/bin/bash

PROJECT_NAME="letterpress-app"
PARENT_DIR=$(dirname "$PWD")
PARENT_DIR_BASENAME=$(basename "$PARENT_DIR")
BRANCH_NAME="ep/$1"
WORKTREE_NAME=$1
DIR="$PARENT_DIR/.gitworktrees/$WORKTREE_NAME"

# Check if branch name argument is provided
if [ $# -eq 0 ]; then
    echo "Error: Branch name argument is required"
    echo "Usage: $0 <branch-name>"
    exit 1
fi

# Exit if not in the correct project directory
if [[ $PARENT_DIR_BASENAME != "$PROJECT_NAME" ]]; then
    echo "Error: This script must be run from within the $PROJECT_NAME project"
    exit 1
fi

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
