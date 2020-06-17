# dotfiles

### Elmo's configurations

To install everything, copy-paste the following to your terminal:
(also available in a gist: https://gist.github.com/elmo-p/4d864166568046691911bc37c0d59af8)

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
mkdir ~/code && cd ~/code
git clone https://github.com/elmo-p/dotfiles.git
cd ..
chmod +x ~/code/dotfiles/init.sh
source ~/code/dotfiles/init.sh
```
