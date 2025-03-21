return {
  {
    "mfussenegger/nvim-lint",
    disable = true,
    event = { "BufReadPre", "BufNewFile" },
    config = function()
      local lint = require("lint")

      lint.linters_by_ft = {
        ruby = { "rubocop" },
      }

      local function debounce(ms, fn)
        local timer = vim.uv.new_timer()
        return function(...)
          local argv = { ... }
          timer:stop()
          timer:start(ms, 0, function()
            timer:stop()
            vim.schedule_wrap(fn)(unpack(argv))
          end)
        end
      end

      local debounced_lint = debounce(750, function()
        lint.try_lint()
      end)

      vim.api.nvim_create_autocmd({ "BufWritePost", "BufReadPost", "InsertLeave", "TextChanged" }, {
        callback = function()
          debounced_lint()
        end,
      })
    end,
  },
}
