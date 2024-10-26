return {
  "roobert/tailwindcss-colorizer-cmp.nvim",
  lazy = false,
  config = function()
    require("tailwindcss-colorizer-cmp").setup({})
    require("cmp").setup({
      formatting = { format = require("tailwindcss-colorizer-cmp").formatter },
    })
  end
}
