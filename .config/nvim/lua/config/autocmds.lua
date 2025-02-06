-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua

-- Disable autoformat for files from work
vim.api.nvim_create_autocmd({ "FileType" }, {
  pattern = { "ruby", "eruby", "javascript", "toml", "bash", "sh" },
  callback = function()
    vim.b.autoformat = false
  end,
})

-- https://github.com/nvim-treesitter/nvim-treesitter/issues/2566
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "ruby" },
  command = "setlocal indentkeys-=.",
})
