return {
  {
    "saghen/blink.cmp",
    opts = {
      sources = {
        -- adding any nvim-cmp sources here will enable them
        -- with blink.compat
        compat = { "obsidian", "obsidian_new", "obsidian_tags" },
        default = { "snippets", "lsp", "path", "buffer" },
      },
    },
  },
  {
    "saghen/blink.compat",
    optional = false, -- make optional so it's only enabled if any extras need it
    opts = {},
    version = not vim.g.lazyvim_blink_main and "*",
  },
}
