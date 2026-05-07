return {
  'neovim/nvim-lspconfig',
  cmd = {'LspInfo', 'LspStart'},
  event = {'BufReadPre', 'BufNewFile'},
  dependencies = {
    {'hrsh7th/cmp-nvim-lsp'},
  },
  config = function()
    local cmp_capabilities = require('cmp_nvim_lsp').default_capabilities()

    vim.lsp.config('*', {
      capabilities = cmp_capabilities,
    })

    vim.lsp.config('lua_ls', {
      settings = {
        Lua = {
          runtime = { version = "Lua 5.1" },
          diagnostics = {
            globals = { "bit", "vim", "it", "describe", "before_each", "after_each", "hs" },
          }
        }
      }
    })

    local lsp_group = vim.api.nvim_create_augroup("custom_lsp", { clear = true })

    -- Start ruby_lsp manually via FileType autocmd. cmd_env passes through
    -- reliably here (vim.lsp.config doesn't propagate cmd_env in 0.11.3).
    -- Formatting/linting is handled by nvim-lint + conform, not ruby_lsp.
    vim.api.nvim_create_autocmd('FileType', {
      group = lsp_group,
      pattern = 'ruby',
      callback = function(args)
        vim.lsp.start({
          name = 'ruby_lsp',
          cmd = { 'ruby-lsp' },
          root_dir = vim.fs.root(args.buf, { 'Gemfile', '.git' }),
          cmd_env = { BUNDLE_GEMFILE = "" },
          capabilities = cmp_capabilities,
          init_options = {
            formatter = "none",
            linters = {},
          },
        })
      end,
    })

    vim.api.nvim_create_autocmd('LspAttach', {
      group = lsp_group,
      desc = 'LSP actions',
      callback = function(event)
        local opts = { buffer = event.buf }
        vim.keymap.set('n', 'K', vim.lsp.buf.hover, vim.tbl_extend('force', opts, { desc = 'Show info (LSP)' }))
        vim.keymap.set('n', 'gd', vim.lsp.buf.definition, vim.tbl_extend('force', opts, { desc = 'Go to Definition (LSP)' }))
        vim.keymap.set('n', 'gr', vim.lsp.buf.references, vim.tbl_extend('force', opts, { desc = 'Go to References (LSP)' }))
        vim.keymap.set({'n', 'x'}, '<leader>cf', function() vim.lsp.buf.format({ async = true }) end, vim.tbl_extend('force', opts, { desc = 'Code Format' }))
      end,
    })

    vim.lsp.enable('lua_ls')
    vim.lsp.enable('gopls')
  end
}
