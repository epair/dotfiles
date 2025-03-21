vim.keymap.set("i", "jk", "<Esc>")
vim.keymap.set("i", "kj", "<Esc>")

-- vim.keymap.set("n", "<leader>e", vim.cmd.Ex, { desc = 'File explorer' })

vim.keymap.set({"n", "v"}, "<C-s>", ":w <CR>", { desc = 'Save' })

vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv", { desc = 'Move block up' })
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv", { desc = 'Move block down' })

vim.keymap.set("n", "J", "mzJ`z", { desc = 'Smoother line join' })
vim.keymap.set("n", "<C-d>", "<C-d>zz", { desc = 'Smoother page down' })
vim.keymap.set("n", "<C-u>", "<C-u>zz", { desc = 'Smoother page up' })

vim.keymap.set("x", "<leader>p", [["_dP]], { desc = 'Paste without yanking' })

vim.keymap.set({"n", "v"}, "<leader>y", [["+y]], { desc = 'Yank to Clipboard' })
vim.keymap.set("n", "<leader>Y", [["+Y]], { desc = 'Yank to Clipboard' })

vim.keymap.set({"n", "v"}, "<leader>d", "\"_d", { desc = 'Delete with yanking' })

vim.keymap.set("n", "<leader>s", [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]], { desc = 'Search and Replace currect word in buffer' })
vim.keymap.set("n", "<leader>x", "<cmd>!chmod +x %<CR>", { silent = true, desc = 'Make current buffer executable' })
