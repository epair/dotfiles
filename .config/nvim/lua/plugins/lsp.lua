return {
  'neovim/nvim-lspconfig',
  cmd = {'LspInfo', 'LspStart'},
  event = {'BufReadPre', 'BufNewFile'},
  dependencies = {
    {'hrsh7th/cmp-nvim-lsp'},
  },
  init = function()
    -- Reserve a space in the gutter
    -- This will avoid an annoying layout shift in the screen
    vim.opt.signcolumn = 'yes'
    vim.diagnostic.config({
      signs = {
        text = {
          [vim.diagnostic.severity.ERROR] = " ",
          [vim.diagnostic.severity.WARN] = " ",
          [vim.diagnostic.severity.HINT] = " ",
          [vim.diagnostic.severity.INFO] = " "
        },
      }
    })
  end,
  config = function()
    local cmp_capabilities = require('cmp_nvim_lsp').default_capabilities()

    -- Apply cmp capabilities to all LSP servers
    vim.lsp.config('*', {
      capabilities = cmp_capabilities,
    })

    -- Configure individual servers
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

    -- Start ruby_lsp manually to conditionally set cmd_env per root_dir
    -- (on_new_config is not supported in the native vim.lsp.config API)
    local letterpress_path = vim.fn.resolve(vim.fn.expand("~/code/postie/letterpress-app"))
    vim.api.nvim_create_autocmd('FileType', {
      pattern = 'ruby',
      callback = function(args)
        local root = vim.fs.root(args.buf, { 'Gemfile', '.git' })
        local cmd_env = {}
        if root and vim.startswith(root, letterpress_path) then
          cmd_env = { BUNDLE_GEMFILE = "" }
        end
        vim.lsp.start({
          name = 'ruby_lsp',
          cmd = { 'ruby-lsp' },
          root_dir = root,
          cmd_env = cmd_env,
          capabilities = cmp_capabilities,
          init_options = {
            formatter = "none",
            linters = {},
          },
        })
      end,
    })

    -- LspAttach is where you enable features that only work
    -- if there is a language server active in the file
    vim.api.nvim_create_autocmd('LspAttach', {
      desc = 'LSP actions',
      callback = function(event)
        vim.keymap.set('n', 'K', '<cmd>lua vim.lsp.buf.hover()<cr>', { buffer = event.buf, desc = 'Show info (LSP)' })
        vim.keymap.set('n', 'gd', '<cmd>lua vim.lsp.buf.definition()<cr>', { buffer = event.buf, desc = 'Go to Definition (LSP)' })
        -- vim.keymap.set('n', 'gD', '<cmd>lua vim.lsp.buf.declaration()<cr>', { buffer = event.buf, desc = 'Go to Declaration (LSP)' })
        -- vim.keymap.set('n', 'gi', '<cmd>lua vim.lsp.buf.implementation()<cr>', { buffer = event.buf, desc = 'Go to Implementation (LSP)' })
        -- vim.keymap.set('n', 'go', '<cmd>lua vim.lsp.buf.type_definition()<cr>', { buffer = event.buf, desc = 'Go to Type Definition (LSP)' })
        vim.keymap.set('n', 'gr', '<cmd>lua vim.lsp.buf.references()<cr>', { buffer = event.buf, desc = 'Go to References (LSP)' })
        -- vim.keymap.set('n', 'gs', '<cmd>lua vim.lsp.buf.signature_help()<cr>', { buffer = event.buf, desc = 'Go to Signature (LSP)' })
        -- vim.keymap.set('n', '<F2>', '<cmd>lua vim.lsp.buf.rename()<cr>', { buffer = event.buf, desc = 'Rename (LSP)' })
        vim.keymap.set({'n', 'x'}, '<leader>cf', '<cmd>lua vim.lsp.buf.format({async = true})<cr>', { buffer = event.buf, desc = 'Code Format' })
        -- vim.keymap.set('n', '<F4>', '<cmd>lua vim.lsp.buf.code_action()<cr>', { buffer = event.buf, desc = 'Code Action' })
      end,
    })

    vim.lsp.enable('lua_ls')
    vim.lsp.enable('gopls')
  end
}
