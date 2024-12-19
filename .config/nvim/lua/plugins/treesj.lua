return {
  "Wansmer/treesj",
  dependencies = { "nvim-treesitter/nvim-treesitter" },
  opts = {
    max_join_length = 480,
  },
  config = function(_, opts)
    require("treesj").setup(opts)
  end,
}
