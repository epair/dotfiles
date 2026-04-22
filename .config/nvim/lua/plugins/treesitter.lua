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
