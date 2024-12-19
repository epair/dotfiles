return {
  "Wansmer/treesj",
  keys = { "<space>m", desc = "Toggle block" },
  dependencies = { "nvim-treesitter/nvim-treesitter" },
  opts = {
    max_join_length = 480,
  },
  config = function(_, opts)
    require("treesj").setup(opts)
  end,
}
