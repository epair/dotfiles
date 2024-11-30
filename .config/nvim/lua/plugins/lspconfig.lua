-- LSP Plugins
return {
  {
    'folke/lazydev.nvim',
    ft = 'lua',
    opts = {
      library = {
        { path = 'luvit-meta/library', words = { 'vim%.uv' } },
      },
    },
  },
  { 'Bilal2453/luvit-meta', lazy = true },
  {
    'neovim/nvim-lspconfig',
    dependencies = {
      { 'williamboman/mason.nvim', config = true },
      'williamboman/mason-lspconfig.nvim',
      'WhoIsSethDaniel/mason-tool-installer.nvim',
      { 'j-hui/fidget.nvim', opts = {} },
      'hrsh7th/cmp-nvim-lsp',
    },
    config = function()
      -- Create a namespace for diagnostic virtual text
      local diagnostic_ns = vim.api.nvim_create_namespace "diagnostic_virt"

      -- Diagnostic signs configuration
      local signs = { Error = '', Warn = '', Hint = '', Info = '' }
      for type, icon in pairs(signs) do
        local hl = 'DiagnosticSign' .. type
        vim.fn.sign_define(hl, { text = icon, texthl = hl, numhl = hl })
      end

      -- Diagnostic utilities
      local function best_diagnostic(diagnostics)
        if vim.tbl_isempty(diagnostics) then
          return
        end
        local best = nil
        local line_diagnostics = {}
        local line_nr = vim.api.nvim_win_get_cursor(0)[1] - 1

        for k, v in pairs(diagnostics) do
          if v.lnum == line_nr then
            line_diagnostics[k] = v
          end
        end

        for _, diagnostic in pairs(line_diagnostics) do
          if best == nil then
            best = diagnostic
          elseif diagnostic.severity < best.severity then
            best = diagnostic
          end
        end
        return best
      end

      local function current_line_diagnostics(bufnr)
        bufnr = bufnr or 0
        local line_nr = vim.api.nvim_win_get_cursor(0)[1] - 1
        return vim.diagnostic.get(bufnr, { ["lnum"] = line_nr })
      end

      -- Virtual text handler setup
      local virt_handler = vim.diagnostic.handlers.virtual_text
      local severity = vim.diagnostic.severity
      local virt_options = {
        prefix = "",
        format = function(diagnostic)
          local message = vim.split(diagnostic.message, "\n")[1]

          if diagnostic.severity == severity.ERROR then
            return signs.Error .. " " .. message
          elseif diagnostic.severity == severity.INFO then
            return signs.Info .. " " .. message
          elseif diagnostic.severity == severity.WARN then
            return signs.Warn .. " " .. message
          elseif diagnostic.severity == severity.HINT then
            return signs.Hint .. " " .. message
          else
            return message
          end
        end,
      }

      -- Custom diagnostic handler
      vim.diagnostic.handlers.current_line_virt = {
        show = function(_, bufnr, diagnostics, opts)
          -- Always clear existing virtual text first
          virt_handler.hide(diagnostic_ns, bufnr)

          local diagnostic = best_diagnostic(diagnostics)
          if not diagnostic then
            return
          end

          local complete_opts = vim.tbl_extend('force', {
            virtual_text = virt_options,
            float = { source = "always" },
            signs = true,
            underline = true,
            update_in_insert = false,
          }, opts or {})

          pcall(
            virt_handler.show,
            diagnostic_ns,
            bufnr or 0,  -- Ensure bufnr is never nil
            { diagnostic },
            complete_opts
          )
        end,

        hide = function(_, bufnr)
          bufnr = bufnr or vim.api.nvim_get_current_buf()
          virt_handler.hide(diagnostic_ns, bufnr)
        end,
      }

      -- Global diagnostic configuration
      vim.diagnostic.config {
        float = { source = true },
        signs = true,
        virtual_text = false,
        severity_sort = true,
        current_line_virt = true,
        update_in_insert = false,
      }

      -- Setup diagnostic autocommands for each buffer
      local function setup_diagnostic_autocmds(bufnr)
        local group_name = "lsp_diagnostic_buffer_" .. tostring(bufnr)
        local group = vim.api.nvim_create_augroup(group_name, { clear = true })

        -- Show diagnostic on cursor hold
        vim.api.nvim_create_autocmd("CursorHold", {
          group = group,
          buffer = bufnr,
          callback = function()
            vim.diagnostic.handlers.current_line_virt.show(
              0,
              bufnr,
              current_line_diagnostics(bufnr),
              nil
            )
          end,
        })

        -- Hide diagnostic on cursor move or insert mode exit
        vim.api.nvim_create_autocmd({"CursorMoved", "InsertLeave"}, {
          group = group,
          buffer = bufnr,
          callback = function()
            vim.diagnostic.handlers.current_line_virt.hide(0, bufnr)
          end,
        })

        -- Clean up when buffer is detached
        vim.api.nvim_create_autocmd("BufDelete", {
          group = group,
          buffer = bufnr,
          callback = function()
            vim.diagnostic.handlers.current_line_virt.hide(0, bufnr)
            vim.api.nvim_del_augroup_by_name(group_name)
          end,
        })
      end

      -- LSP Attach configuration
      vim.api.nvim_create_autocmd('LspAttach', {
        group = vim.api.nvim_create_augroup('kickstart-lsp-attach', { clear = true }),
        callback = function(event)
          local map = function(keys, func, desc, mode)
            mode = mode or 'n'
            vim.keymap.set(mode, keys, func, { buffer = event.buf, desc = 'LSP: ' .. desc })
          end

          -- Set up all your keymaps here
          map('gd', require('telescope.builtin').lsp_definitions, '[G]oto [D]efinition')
          map('gr', require('telescope.builtin').lsp_references, '[G]oto [R]eferences')
          map('gI', require('telescope.builtin').lsp_implementations, '[G]oto [I]mplementation')
          map('<leader>D', require('telescope.builtin').lsp_type_definitions, 'Type [D]efinition')
          map('<leader>ds', require('telescope.builtin').lsp_document_symbols, '[D]ocument [S]ymbols')
          map('<leader>ws', require('telescope.builtin').lsp_dynamic_workspace_symbols, '[W]orkspace [S]ymbols')
          map('<leader>rn', vim.lsp.buf.rename, '[R]e[n]ame')
          map('<leader>ca', vim.lsp.buf.code_action, '[C]ode [A]ction', { 'n', 'x' })
          map('gD', vim.lsp.buf.declaration, '[G]oto [D]eclaration')

          -- Set up diagnostic handlers for this buffer
          setup_diagnostic_autocmds(event.buf)

          -- Set up document highlight if supported
          local client = vim.lsp.get_client_by_id(event.data.client_id)
          if client and client.supports_method(vim.lsp.protocol.Methods.textDocument_documentHighlight) then
            local highlight_group = vim.api.nvim_create_augroup('kickstart-lsp-highlight-' .. event.buf, { clear = true })

            vim.api.nvim_create_autocmd({ 'CursorHold', 'CursorHoldI' }, {
              buffer = event.buf,
              group = highlight_group,
              callback = vim.lsp.buf.document_highlight,
            })

            vim.api.nvim_create_autocmd({ 'CursorMoved', 'CursorMovedI' }, {
              buffer = event.buf,
              group = highlight_group,
              callback = vim.lsp.buf.clear_references,
            })

            -- Clean up highlights on LSP detach
            vim.api.nvim_create_autocmd('LspDetach', {
              buffer = event.buf,
              group = vim.api.nvim_create_augroup('kickstart-lsp-detach-' .. event.buf, { clear = true }),
              callback = function()
                vim.lsp.buf.clear_references()
                vim.api.nvim_del_augroup_by_name('kickstart-lsp-highlight-' .. event.buf)
              end,
            })
          end

          -- Set up inlay hints if supported
          if client and client.supports_method(vim.lsp.protocol.Methods.textDocument_inlayHint) then
            map('<leader>th', function()
              vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled { bufnr = event.buf })
            end, '[T]oggle Inlay [H]ints')
          end
        end,
      })

      -- LSP server capabilities and configuration
      local capabilities = vim.tbl_deep_extend(
        'force',
        vim.lsp.protocol.make_client_capabilities(),
        require('cmp_nvim_lsp').default_capabilities()
      )

      -- Server configurations
      local servers = {
        eslint = {
          filetypes = { 'javascript', 'typescript' },
        },
        ruby_lsp = {
          cmd_env = { BUNDLE_GEMFILE = vim.fn.getenv 'GLOBAL_GEMFILE' },
          cmd = { 'ruby-lsp' },
          filetypes = { 'ruby', 'eruby' },
        },
        lua_ls = {
          settings = {
            Lua = {
              completion = {
                callSnippet = 'Replace',
              },
            },
          },
        },
      }

      -- Mason setup
      require('mason').setup()

      local ensure_installed = vim.tbl_keys(servers or {})
      vim.list_extend(ensure_installed, {
        'stylua',
      })
      require('mason-tool-installer').setup { ensure_installed = ensure_installed }

      require('mason-lspconfig').setup {
        handlers = {
          function(server_name)
            local server = servers[server_name] or {}
            server.capabilities = vim.tbl_deep_extend('force', {}, capabilities, server.capabilities or {})
            require('lspconfig')[server_name].setup(server)
          end,
        },
      }
    end,
  },
}
