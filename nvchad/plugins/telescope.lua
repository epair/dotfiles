return {
  "nvim-telescope/telescope.nvim",
  config = function()
    require('telescope').load_extension('gh')
  end,
  dependencies = {
    { "nvim-lua/plenary.nvim" },
    { "nvim-telescope/telescope-github.nvim" },
  },
}
