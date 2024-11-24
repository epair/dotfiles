-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua

-- Disable autoformat for files from work
vim.api.nvim_create_autocmd({ "FileType" }, {
  pattern = { "ruby", "eruby", "javascript" },
  callback = function()
    vim.b.autoformat = false
  end,
})

