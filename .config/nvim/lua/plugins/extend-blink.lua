return {
  {
    "saghen/blink.cmp",
    opts = {
      sources = {
        -- adding any nvim-cmp sources here will enable them
        -- with blink.compat
        compat = {},
        default = { "snippets", "lsp", "path", "buffer" },
        cmdline = {},
      },
    },
  },
}
