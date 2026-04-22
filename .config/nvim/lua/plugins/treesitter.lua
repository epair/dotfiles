local ensure_installed = {
  'bash', 'diff', 'html', 'javascript', 'lua', 'luadoc',
  'markdown', 'markdown_inline', 'ruby', 'vim', 'vimdoc',
}

return {
  {
    'nvim-treesitter/nvim-treesitter',
    branch = 'main',
    lazy = false,
    build = ':TSUpdate',
    config = function()
      require('nvim-treesitter').install(ensure_installed)

      vim.api.nvim_create_autocmd('FileType', {
        pattern = ensure_installed,
        callback = function(ev)
          pcall(vim.treesitter.start, ev.buf)
          if ev.match ~= 'ruby' then
            vim.bo[ev.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
          end
        end,
      })

      local selection_stack = nil

      local function select_node(node)
        local srow, scol, erow, ecol = node:range()
        if ecol > 0 then
          ecol = ecol - 1
        else
          erow = erow - 1
          local line = vim.api.nvim_buf_get_lines(0, erow, erow + 1, false)[1] or ''
          ecol = math.max(0, #line - 1)
        end
        if vim.api.nvim_get_mode().mode:sub(1, 1):match('[vV\22]') then
          vim.cmd('normal! \27')
        end
        vim.api.nvim_win_set_cursor(0, { srow + 1, scol })
        vim.cmd('normal! v')
        vim.api.nvim_win_set_cursor(0, { erow + 1, ecol })
      end

      local function same_range(a, b)
        local ar1, ac1, ar2, ac2 = a:range()
        local br1, bc1, br2, bc2 = b:range()
        return ar1 == br1 and ac1 == bc1 and ar2 == br2 and ac2 == bc2
      end

      local function init_selection()
        local node = vim.treesitter.get_node()
        if not node then return end
        selection_stack = { node }
        select_node(node)
      end

      local function node_incremental()
        if not selection_stack then return init_selection() end
        local top = selection_stack[#selection_stack]
        local parent = top:parent()
        while parent and same_range(parent, top) do
          parent = parent:parent()
        end
        if not parent then return select_node(top) end
        table.insert(selection_stack, parent)
        select_node(parent)
      end

      local function node_decremental()
        if not selection_stack or #selection_stack <= 1 then return end
        table.remove(selection_stack)
        select_node(selection_stack[#selection_stack])
      end

      vim.keymap.set('n', '<C-n>', init_selection, { desc = 'Start treesitter node selection' })
      vim.keymap.set('x', '<C-n>', node_incremental, { desc = 'Expand treesitter selection' })
      vim.keymap.set('x', '<C-p>', node_decremental, { desc = 'Shrink treesitter selection' })
    end,
  },
  {
    'nvim-treesitter/nvim-treesitter-textobjects',
    branch = 'main',
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
    config = function()
      require('nvim-treesitter-textobjects').setup {}
      vim.keymap.set('n', '<leader>a', function()
        require('nvim-treesitter-textobjects.swap').swap_next('@parameter.inner')
      end, { desc = 'Swap next parameter' })
      vim.keymap.set('n', '<leader>A', function()
        require('nvim-treesitter-textobjects.swap').swap_previous('@parameter.inner')
      end, { desc = 'Swap previous parameter' })
    end,
  },
}
