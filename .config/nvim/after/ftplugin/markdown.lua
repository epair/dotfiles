vim.opt.conceallevel = 1

-- Enable auto-wrap
vim.opt.wrap = true

vim.keymap.set('n', '<Leader>p', '<CMD>MarkdownPreview<CR>', { noremap = true, silent = true })
