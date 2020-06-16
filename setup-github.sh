#!/bin/sh

ssh-keygen -t rsa -b 4096 -C "elpair@gmail.com"
eval "$(ssh-agent -s)"
touch ~/.ssh/config

/bin/cat <<EOM > ~/.ssh/config
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_rsa
EOM

ssh-add -K ~/.ssh/id_rsa
pbcopy < ~/.ssh/id_rsa.pub
echo "SSH Key copied to clipboard. Add it to your Github Account."
