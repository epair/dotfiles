vim.opt.number = true
vim.opt.relativenumber = true

vim.opt.showmode = false

vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true

vim.opt.smartindent = true

vim.opt.wrap = false

vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
vim.opt.undofile = true

vim.opt.hlsearch = false

vim.opt.termguicolors = true

vim.opt.scrolloff = 8
vim.opt.signcolumn = 'yes'

vim.opt.updatetime = 50

vim.opt.colorcolumn = "80"

vim.opt.fixendofline = false

vim.opt.splitright = true
vim.opt.splitbelow = true

-- for obsidian markdown styling and json file
vim.opt.conceallevel = 2
