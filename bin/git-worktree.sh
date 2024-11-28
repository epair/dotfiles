#!/bin/zsh

PROJECT_NAME="letterpress-app"
PARENT_DIR="$HOME/code/postie/letterpress-app"

# Check if the current directory is either the letterpress-app directory or within a worktree directory
if [[ "$PWD" != "$PARENT_DIR" && "$PWD" != "$PARENT_DIR/.gitworktrees/"* ]]; then
    echo "Error: You must be in the $PARENT_DIR directory or one of its worktrees to run this script."
    return 1
fi
# Check if at least one argument is provided
if (( $# < 1 )); then
    echo "Usage: $0 <add|remove|list|ls|push> [branch-name] [ls-options]"
    return 1
fi

COMMAND=$1
WORKTREE_NAME=${2:-}  # Use empty string if not provided
BRANCH_NAME="ep/$WORKTREE_NAME"
DIR="$PARENT_DIR/.gitworktrees/$WORKTREE_NAME"
CURRENT_DIR=$(pwd)

if [[ "$COMMAND" == "add" ]] && [[ -n "$WORKTREE_NAME" ]]; then
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
elif [[ "$COMMAND" == "remove" ]] && [[ -n "$WORKTREE_NAME" ]]; then
    echo "Removing worktree and branch $BRANCH_NAME"

    # Only cd to parent directory if we're currently in the worktree we're removing
    if [[ "$PWD" == "$DIR"* ]]; then
        cd $PARENT_DIR
    fi

    git worktree remove $WORKTREE_NAME
    git branch -D $BRANCH_NAME
    tmux kill-session -t $WORKTREE_NAME
    zoxide remove $DIR
    echo "Done."
elif [[ "$COMMAND" == "list" ]] || [[ "$COMMAND" == "ls" ]]; then
    # Shift away the first argument (the command)
    shift
    # Pass remaining arguments to ls
    ls "$@" "$PARENT_DIR/.gitworktrees"
elif [[ "$COMMAND" == "push" ]]; then
    BRANCH_NAME=$(git branch --show-current)
    WORKTREE_NAME=${BRANCH_NAME#ep/}
    PR_TITLE="$2"
    REVIEWERS="${3:-njm}"

    if [[ -z "$PR_TITLE" ]]; then
      echo "Error: no PR title provided for 'push' command"
      return 1
    fi

    git push -u origin $BRANCH_NAME
    PR_URL=$(gh pr create --title "$PR_TITLE" --reviewer "$REVIEWERS" --body-file tmp/prs/$WORKTREE_NAME.md)
    open "$PR_URL"
else
    echo "Error: Invalid command. Use 'add', 'remove', 'list', 'ls', or 'push'"
fi
