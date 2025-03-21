return {
  'stevearc/oil.nvim',
  opts = {},
  dependencies = { "nvim-tree/nvim-web-devicons" },
  lazy = false,
  config = function ()
    require("oil").setup()
    vim.keymap.set("n", "<leader>e", "<CMD>Oil<CR>", { desc = "Open File explorer" })
  end
}
