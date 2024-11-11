-- Set <space> as the leader key
-- See `:help mapleader`
--  NOTE: Must happen before plugins are loaded (otherwise wrong leader will be used)
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

-- Set to true if you have a Nerd Font installed and selected in the terminal
vim.g.have_nerd_font = true

-- Load all configuration files from config directory
local config_path = vim.fn.stdpath 'config' .. '/lua/config'
local config_files = vim.fn.readdir(config_path, [[v:val =~ '\.lua$']])
table.sort(config_files) -- Sort files to ensure consistent load order
for _, file in ipairs(config_files) do
  require('config.' .. file:gsub('%.lua$', ''))
end

-- The line beneath this is called `modeline`. See `:help modeline`
-- vim: ts=2 sts=2 sw=2 et
