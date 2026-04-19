return {
  "rachartier/tiny-inline-diagnostic.nvim",
  event = "VeryLazy",
  priority = 1000, -- needs to be loaded before lsp can display
  config = function()
    require('tiny-inline-diagnostic').setup({
      options = {
        add_messages = {
          display_count = true,
        },
        multilines = {
          enabled = true,
        },
      }
    })
    vim.diagnostic.config({ virtual_text = false })
  end
}
