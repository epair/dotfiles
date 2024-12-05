#!/bin/zsh

PROJECT_NAME="letterpress-app"
PARENT_DIR="$HOME/code/postie/letterpress-app"

# Check if the current directory is either the letterpress-app directory or within a worktree directory
if [[ "$PWD" != "$PARENT_DIR" && "$PWD" != "$PARENT_DIR/"* ]]; then
    echo "Error: You must be in the $PARENT_DIR directory or one of its worktrees to run this script."
    return 1
fi

# Check if at least one argument is provided
if (( $# < 1 )); then
    echo "Usage: $0 <add|remove|pr> [branch-name] [--no-prefix]"
    return 1
fi

COMMAND=$1
WORKTREE_NAME=${2:-}  # Use empty string if not provided
NO_PREFIX=false

# Check for --no-prefix flag
for arg in "$@"; do
    if [[ "$arg" == "--no-prefix" ]]; then
        NO_PREFIX=true
        break
    fi
done

# Adjust branch name based on --no-prefix flag
if $NO_PREFIX; then
    BRANCH_NAME="$WORKTREE_NAME"
else
    BRANCH_NAME="ep/$WORKTREE_NAME"
fi

DIR="$PARENT_DIR/$WORKTREE_NAME"
CURRENT_DIR=$(pwd)

if [[ "$COMMAND" == "add" ]] && [[ -n "$WORKTREE_NAME" ]]; then
    # Check if branch exists locally
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        echo "Branch $BRANCH_NAME already exists locally, using existing branch"
    # Check if branch exists remotely
    elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH_NAME"; then
        echo "Branch $BRANCH_NAME exists remotely, fetching branch"
        git fetch origin "$BRANCH_NAME:$BRANCH_NAME"
    else
        echo "Creating new branch $BRANCH_NAME"
        git branch "$BRANCH_NAME" main
    fi

    # Add worktree for the new branch
    git worktree add "$DIR" "$BRANCH_NAME"

    # Create .env file with COMPOSE_PROJECT_NAME
    echo "COMPOSE_PROJECT_NAME=$PROJECT_NAME" > "$DIR/.env"

    # Create config directory and copy application.yml from main worktree
    cp "$PARENT_DIR/main/config/application.yml" "$DIR/config/."

    mkdir -p "$DIR/tmp/prs"
    touch "$DIR/tmp/prs/$WORKTREE_NAME.md"

    zoxide add "$DIR"

    sesh connect "$WORKTREE_NAME"
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
elif [[ "$COMMAND" == "pr" ]]; then
    BRANCH_NAME=$(git branch --show-current)
    WORKTREE_NAME=${BRANCH_NAME#ep/}
    PR_TITLE="$2"
    REVIEWERS="${3:-njm}"

    if [[ -z "$PR_TITLE" ]]; then
        echo "Error: no PR title provided for 'pr' command"
        return 1
    fi

    git push -u origin $BRANCH_NAME
    gh pr create --title "$PR_TITLE" --reviewer "$REVIEWERS" --body-file=tmp/prs/$WORKTREE_NAME.md
else
    echo "Error: Invalid command. Use 'add', 'remove', or 'pr'"
fi
