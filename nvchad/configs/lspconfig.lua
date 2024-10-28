-- load defaults i.e lua_lsp
require("nvchad.configs.lspconfig").defaults()

local lspconfig = require "lspconfig"

-- EXAMPLE
local servers = { "html", "cssls", "solargraph", "tailwindcss" }
local nvlsp = require"nvchad.configs.lspconfig"

-- lsps with default config
for _, lsp in ipairs(servers) do
  if lsp == "solargraph" then
    lspconfig[lsp].setup {
      on_attach = nvlsp.on_attach,
      on_init = nvlsp.on_init,
      capabilities = nvlsp.capabilities,
      settings = {
        solargraph = {
          diagnostics = true,
          formatting = false,  -- Disable LSP formatting
          completion = true,
          useBundler = true,
        },
        editor = {
          tabSize = 2,
          insertSpaces = true,
          autoIndent = true,  -- Enable auto indentation
          formatOnType = false  -- Disable format on type
        }
      }
    }
  else
    lspconfig[lsp].setup {
      on_attach = nvlsp.on_attach,
      on_init = nvlsp.on_init,
      capabilities = nvlsp.capabilities,
    }
  end
end


-- configuring single server, example: typescript
-- lspconfig.ts_ls.setup {
--   on_attach = nvlsp.on_attach,
--   on_init = nvlsp.on_init,
--   capabilities = nvlsp.capabilities,
-- }
