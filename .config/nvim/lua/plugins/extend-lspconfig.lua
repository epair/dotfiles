return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      autoformat = false,
      servers = {
        ruby_lsp = {
          cmd_env = { BUNDLE_GEMFILE = vim.fn.getenv("GLOBAL_GEMFILE") },
        },
      },
      diagnostics = {
        virtual_text = false,
      },
    },
  },
}
